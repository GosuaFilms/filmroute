import type Stripe from 'stripe';
import { adminClient, json } from './_shared.js';
import { stripeClient } from './_stripe.js';

// Avisos de Stripe: registra las licencias compradas y mantiene al día el estado de la suscripción.
// Stripe reintenta los avisos que fallan, así que cada operación es idempotente.

async function grantFilmLicense(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.client_reference_id ?? session.metadata?.user_id;
  if (!userId) throw new Error(`Sesión ${session.id} sin usuario`);
  const admin = adminClient();

  // Solo se asocia a la película indicada si es del comprador
  let strategyId: string | null = null;
  const requested = session.metadata?.strategy_id;
  if (requested) {
    const { data } = await admin.from('strategies').select('id').eq('id', requested).eq('user_id', userId).maybeSingle();
    if (data) strategyId = data.id;
  }
  // Si esa película ya tiene una licencia vigente, la nueva queda libre para otra
  if (strategyId) {
    const { data: existing } = await admin.from('film_licenses').select('id').eq('strategy_id', strategyId).limit(1);
    if (existing && existing.length > 0) strategyId = null;
  }

  const { error } = await admin
    .from('film_licenses')
    .upsert({ user_id: userId, strategy_id: strategyId, stripe_session_id: session.id }, { onConflict: 'stripe_session_id', ignoreDuplicates: true });
  if (error) throw new Error(`film_licenses: ${error.message}`);
}

async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const admin = adminClient();
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  let userId = subscription.metadata?.user_id ?? null;
  if (!userId) {
    const { data } = await admin.from('billing_accounts').select('user_id').eq('stripe_customer_id', customerId).maybeSingle();
    userId = data?.user_id ?? null;
  }
  if (!userId) throw new Error(`Suscripción ${subscription.id} sin usuario`);

  const item = subscription.items.data[0];
  const { error } = await admin.from('billing_accounts').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    subscription_id: subscription.id,
    subscription_status: subscription.status,
    subscription_interval: item?.price.recurring?.interval ?? null,
    current_period_end: item ? new Date(item.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`billing_accounts: ${error.message}`);
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');
  if (!secret || !signature) return json(400, { error: 'Falta la firma' });

  const stripe = stripeClient();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await request.text(), signature, secret);
  } catch (e) {
    console.error('[stripe-webhook] firma no válida:', e instanceof Error ? e.message : e);
    return json(400, { error: 'Firma no válida' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;
        if (session.mode === 'payment' && session.payment_status === 'paid' && session.metadata?.plan === 'film') {
          await grantFilmLicense(session);
        } else if (session.mode === 'subscription' && session.subscription) {
          const id = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          await syncSubscription(await stripe.subscriptions.retrieve(id));
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object);
        break;
      default:
        break;
    }
  } catch (e) {
    // Un 500 hace que Stripe reintente el aviso más tarde
    console.error(`[stripe-webhook] ${event.type} falló:`, e instanceof Error ? e.message : e);
    return json(500, { error: 'No se pudo procesar el aviso' });
  }
  return json(200, { received: true });
}
