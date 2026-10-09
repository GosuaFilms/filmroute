import { adminClient, authorize, checkDailyLimit, isAdminUser, json } from './_shared.js';

// Autoriza un análisis con IA: plan productora activo, licencia de la película o cuenta de administrador.
// Devuelve el id que las fases de investigación y redacción deben presentar.

const SUBSCRIPTION_MONTHLY_ANALYSES = 25;
const SUBSCRIPTION_ACTIVE_FILMS = 5;
const LICENSE_DAYS = 365;
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function paymentRequired(code: string, error: string): Response {
  return json(402, { error, code });
}

export async function POST(request: Request): Promise<Response> {
  const auth = await authorize(request);
  if (auth instanceof Response) return auth;
  const limited = await checkDailyLimit(auth);
  if (limited) return limited;
  const { supabase, user } = auth;

  let body: { strategyId?: unknown };
  try {
    body = await request.json() as { strategyId?: unknown };
  } catch {
    return json(400, { error: 'JSON no válido' });
  }
  const strategyId = typeof body.strategyId === 'string' ? body.strategyId : '';
  if (!/^[0-9a-f-]{36}$/i.test(strategyId)) return json(400, { error: 'Falta la película' });

  // Con el token del usuario: RLS garantiza que la estrategia es suya
  const { data: strategy } = await supabase.from('strategies').select('id').eq('id', strategyId).maybeSingle();
  if (!strategy) return json(404, { error: 'Película no encontrada' });

  const admin = adminClient();
  const startRun = async (source: 'film' | 'subscription' | 'admin', licenseId: string | null = null) => {
    const { data, error } = await admin
      .from('analysis_runs')
      .insert({ user_id: user.id, strategy_id: strategyId, source, license_id: licenseId })
      .select('id')
      .single();
    if (error || !data) {
      console.error('[start-analysis] insert run failed:', error?.message);
      return json(503, { error: 'No se pudo iniciar el análisis' });
    }
    return json(200, { analysisId: data.id, source });
  };

  try {
    if (await isAdminUser(auth)) return await startRun('admin');

    const now = new Date();

    // 1. Plan productora activo
    const { data: account } = await admin
      .from('billing_accounts')
      .select('subscription_status, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();
    const subscriptionActive = !!account
      && ['active', 'trialing'].includes(account.subscription_status ?? '')
      && !!account.current_period_end && new Date(account.current_period_end) > now;

    if (subscriptionActive) {
      const since = new Date(now.getTime() - WINDOW_MS).toISOString();
      const { data: runs } = await admin
        .from('analysis_runs')
        .select('strategy_id')
        .eq('user_id', user.id)
        .eq('source', 'subscription')
        .gte('created_at', since);
      const recent = runs ?? [];
      if (recent.length >= SUBSCRIPTION_MONTHLY_ANALYSES) {
        return paymentRequired('monthly_limit', `Has usado los ${SUBSCRIPTION_MONTHLY_ANALYSES} análisis de tu plan en los últimos 30 días.`);
      }
      const films = new Set(recent.map(r => r.strategy_id).filter(Boolean));
      if (!films.has(strategyId) && films.size >= SUBSCRIPTION_ACTIVE_FILMS) {
        return paymentRequired('films_limit', `Tu plan permite trabajar con ${SUBSCRIPTION_ACTIVE_FILMS} películas a la vez en 30 días.`);
      }
      return await startRun('subscription');
    }

    // 2. Licencia ya asignada a esta película
    const { data: assigned } = await admin
      .from('film_licenses')
      .select('id, analyses_used, analyses_limit, expires_at')
      .eq('user_id', user.id)
      .eq('strategy_id', strategyId)
      .order('created_at', { ascending: true });
    const usable = (assigned ?? []).find(l =>
      l.analyses_used < l.analyses_limit && (!l.expires_at || new Date(l.expires_at) > now));
    if (usable) {
      // La condición sobre analyses_used evita gastar dos veces el mismo hueco con peticiones simultáneas
      const { data: updated } = await admin
        .from('film_licenses')
        .update({ analyses_used: usable.analyses_used + 1 })
        .eq('id', usable.id)
        .eq('analyses_used', usable.analyses_used)
        .select('id');
      if (!updated || updated.length === 0) return json(409, { error: 'Inténtalo de nuevo en unos segundos' });
      return await startRun('film', usable.id);
    }

    // 3. Licencia sin película (recién comprada, o de una película que se borró): se asigna a esta.
    // Conserva los análisis usados y la caducidad que tuviera; el año empieza a contar con el primer uso.
    const { data: free } = await admin
      .from('film_licenses')
      .select('id, analyses_used, analyses_limit, expires_at')
      .eq('user_id', user.id)
      .is('strategy_id', null)
      .order('created_at', { ascending: true });
    const freeUsable = (free ?? []).find(l =>
      l.analyses_used < l.analyses_limit && (!l.expires_at || new Date(l.expires_at) > now));
    if (freeUsable) {
      const expires = freeUsable.expires_at
        ?? new Date(now.getTime() + LICENSE_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { data: updated } = await admin
        .from('film_licenses')
        .update({ strategy_id: strategyId, analyses_used: freeUsable.analyses_used + 1, expires_at: expires })
        .eq('id', freeUsable.id)
        .is('strategy_id', null)
        .eq('analyses_used', freeUsable.analyses_used)
        .select('id');
      if (!updated || updated.length === 0) return json(409, { error: 'Inténtalo de nuevo en unos segundos' });
      return await startRun('film', freeUsable.id);
    }

    if ((assigned ?? []).length > 0) {
      return paymentRequired('film_exhausted', 'Has usado todos los análisis incluidos para esta película o la licencia ha caducado.');
    }
    return paymentRequired('payment_required', 'Para generar el análisis con IA de esta película necesitas una licencia o el plan productora.');
  } catch (e) {
    console.error('[start-analysis] error:', e instanceof Error ? e.message : e);
    return json(500, { error: 'Error interno' });
  }
}
