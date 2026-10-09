import { supabase } from './supabase';

export type CheckoutPlan = 'film' | 'monthly' | 'yearly';

// Error de la API con el código que devuelve el servidor (p. ej. payment_required)
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
  }
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new ApiError('Sin sesión', 401);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null) as { error?: string; code?: string } | null;
    throw new ApiError(err?.error ?? `Error ${res.status}`, res.status, err?.code);
  }
  return res.json() as Promise<T>;
}

// Tras volver de Stripe se reabre la película desde la que se pagó
const PENDING_KEY = 'filmroute_pending_checkout';

export function rememberPendingCheckout(strategyId: string | null): void {
  try {
    if (strategyId) sessionStorage.setItem(PENDING_KEY, strategyId);
  } catch {
    // Sin almacenamiento de sesión: el usuario abrirá la película desde el panel
  }
}

export function takePendingCheckout(): string | null {
  try {
    const id = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return id;
  } catch {
    return null;
  }
}

export async function startCheckout(plan: CheckoutPlan, strategyId: string | null): Promise<void> {
  rememberPendingCheckout(strategyId);
  const { url } = await apiPost<{ url: string }>('/api/checkout', { plan, strategyId });
  window.location.assign(url);
}

export async function openBillingPortal(): Promise<void> {
  const { url } = await apiPost<{ url: string }>('/api/billing-portal', {});
  window.location.assign(url);
}

export interface FilmLicense {
  id: string;
  strategy_id: string | null;
  analyses_used: number;
  analyses_limit: number;
  expires_at: string | null;
  created_at: string;
  strategies: { film_title: string } | null;
}

export interface BillingSummary {
  hasCustomer: boolean;
  subscription: {
    status: string;
    interval: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  licenses: FilmLicense[];
}

export async function getBillingSummary(): Promise<BillingSummary> {
  const [account, licenses] = await Promise.all([
    supabase.from('billing_accounts').select('*').maybeSingle(),
    supabase.from('film_licenses').select('id, strategy_id, analyses_used, analyses_limit, expires_at, created_at, strategies(film_title)').order('created_at', { ascending: false }),
  ]);
  const a = account.data;
  return {
    hasCustomer: !!a?.stripe_customer_id,
    subscription: a?.subscription_id
      ? {
        status: a.subscription_status,
        interval: a.subscription_interval,
        currentPeriodEnd: a.current_period_end,
        cancelAtPeriodEnd: a.cancel_at_period_end,
      }
      : null,
    licenses: (licenses.data ?? []) as unknown as FilmLicense[],
  };
}
