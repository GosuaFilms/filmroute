import { adminClient, authorize, json } from './_shared.js';
import { appOrigin, stripeClient } from './_stripe.js';

// Portal de cliente de Stripe: cancelar o cambiar el plan, actualizar la tarjeta y descargar facturas
export async function POST(request: Request): Promise<Response> {
  const auth = await authorize(request);
  if (auth instanceof Response) return auth;

  try {
    const { data: account } = await adminClient()
      .from('billing_accounts')
      .select('stripe_customer_id')
      .eq('user_id', auth.user.id)
      .maybeSingle();
    if (!account?.stripe_customer_id) return json(404, { error: 'Todavía no tienes pagos registrados' });

    const session = await stripeClient().billingPortal.sessions.create({
      customer: account.stripe_customer_id,
      return_url: `${appOrigin(request)}/`,
      locale: 'es',
    });
    return json(200, { url: session.url });
  } catch (e) {
    console.error('[billing-portal] error:', e instanceof Error ? e.message : e);
    return json(502, { error: 'No se pudo abrir el portal de pagos. Inténtalo de nuevo.' });
  }
}
