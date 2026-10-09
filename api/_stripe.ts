import Stripe from 'stripe';

export type Plan = 'film' | 'monthly' | 'yearly';

// Precios con IVA incluido. Se crean en Stripe la primera vez que se necesitan (búsqueda por lookup_key)
const PRICES: Record<Plan, { lookupKey: string; product: string; amount: number; interval?: 'month' | 'year' }> = {
  film: { lookupKey: 'filmroute_film', product: 'FilmRoute · Estrategia por película', amount: 6900 },
  monthly: { lookupKey: 'filmroute_productora_monthly', product: 'FilmRoute · Plan productora (mensual)', amount: 9900, interval: 'month' },
  yearly: { lookupKey: 'filmroute_productora_yearly', product: 'FilmRoute · Plan productora (anual)', amount: 99000, interval: 'year' },
};

export function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Falta STRIPE_SECRET_KEY');
  return new Stripe(key);
}

export async function priceIdFor(stripe: Stripe, plan: Plan): Promise<string> {
  const cfg = PRICES[plan];
  const found = await stripe.prices.list({ lookup_keys: [cfg.lookupKey], active: true, limit: 1 });
  if (found.data[0]) return found.data[0].id;
  try {
    const product = await stripe.products.create({ name: cfg.product, metadata: { filmroute_plan: plan } });
    const price = await stripe.prices.create({
      product: product.id,
      currency: 'eur',
      unit_amount: cfg.amount,
      tax_behavior: 'inclusive',
      lookup_key: cfg.lookupKey,
      ...(cfg.interval ? { recurring: { interval: cfg.interval } } : {}),
    });
    return price.id;
  } catch (e) {
    // Otra petición pudo crearlo a la vez: el lookup_key es único
    const retry = await stripe.prices.list({ lookup_keys: [cfg.lookupKey], active: true, limit: 1 });
    if (retry.data[0]) return retry.data[0].id;
    throw e;
  }
}

const ALLOWED_ORIGINS = [/^https:\/\/(www\.)?filmroute\.ai$/, /^https:\/\/[a-z0-9-]+\.vercel\.app$/, /^http:\/\/localhost:\d+$/];

export function appOrigin(request: Request): string {
  const origin = request.headers.get('origin') ?? '';
  return ALLOWED_ORIGINS.some(r => r.test(origin)) ? origin : 'https://www.filmroute.ai';
}
