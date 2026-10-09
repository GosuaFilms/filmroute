import { adminClient, authorize, json } from './_shared.js';
import { appOrigin, priceIdFor, stripeClient, type Plan } from './_stripe.js';

// Crea la página de pago de Stripe para una película (pago único) o el plan productora (suscripción)
export async function POST(request: Request): Promise<Response> {
  const auth = await authorize(request);
  if (auth instanceof Response) return auth;
  const { supabase, user } = auth;

  let body: { plan?: unknown; strategyId?: unknown };
  try {
    body = await request.json() as { plan?: unknown; strategyId?: unknown };
  } catch {
    return json(400, { error: 'JSON no válido' });
  }
  const plan = body.plan;
  if (plan !== 'film' && plan !== 'monthly' && plan !== 'yearly') return json(400, { error: 'Plan no válido' });

  // La licencia se asocia a la película desde la que se compra, si es del usuario
  let strategyId = '';
  if (plan === 'film' && typeof body.strategyId === 'string' && /^[0-9a-f-]{36}$/i.test(body.strategyId)) {
    const { data } = await supabase.from('strategies').select('id').eq('id', body.strategyId).maybeSingle();
    if (data) strategyId = data.id;
  }

  try {
    const stripe = stripeClient();
    const admin = adminClient();

    const { data: account } = await admin
      .from('billing_accounts')
      .select('stripe_customer_id, subscription_status')
      .eq('user_id', user.id)
      .maybeSingle();
    if (plan !== 'film' && ['active', 'trialing', 'past_due'].includes(account?.subscription_status ?? '')) {
      return json(409, { error: 'Ya tienes el plan productora. Puedes gestionarlo desde «Mi cuenta».' });
    }

    let customerId = account?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: (user.user_metadata?.full_name as string | undefined) ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      const { error } = await admin
        .from('billing_accounts')
        .upsert({ user_id: user.id, stripe_customer_id: customerId, updated_at: new Date().toISOString() });
      if (error) throw new Error(`billing_accounts upsert: ${error.message}`);
    }

    const origin = appOrigin(request);
    const metadata = { user_id: user.id, plan: plan as Plan, strategy_id: strategyId };
    const session = await stripe.checkout.sessions.create({
      mode: plan === 'film' ? 'payment' : 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: await priceIdFor(stripe, plan), quantity: 1 }],
      metadata,
      locale: 'es',
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      customer_update: { name: 'auto', address: 'auto' },
      allow_promotion_codes: true,
      custom_text: {
        submit: {
          message: 'Al pagar aceptas los Términos de uso de FilmRoute (filmroute.ai/terminos) y que el servicio empiece de inmediato. Si tu primer informe no te resulta útil, te devolvemos el dinero en 14 días.',
        },
      },
      ...(plan === 'film'
        ? { invoice_creation: { enabled: true }, payment_intent_data: { metadata } }
        : { subscription_data: { metadata } }),
      success_url: `${origin}/?pago=ok`,
      cancel_url: `${origin}/?pago=cancelado`,
    });
    if (!session.url) throw new Error('Stripe no devolvió la URL de pago');
    return json(200, { url: session.url });
  } catch (e) {
    console.error('[checkout] error:', e instanceof Error ? e.message : e);
    return json(502, { error: 'No se pudo abrir la página de pago. Inténtalo de nuevo.' });
  }
}
