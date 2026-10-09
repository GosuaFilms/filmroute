import Anthropic from '@anthropic-ai/sdk';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export const MODEL = 'claude-opus-5-5';

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export interface AuthContext {
  supabase: SupabaseClient;
  user: User;
}

// Solo usuarios autenticados pueden consumir créditos de IA. El cliente usa el token del usuario
// para que las políticas RLS se apliquen en su nombre.
export async function authorize(request: Request): Promise<AuthContext | Response> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !process.env.ANTHROPIC_API_KEY) {
    return json(500, { error: 'Servidor no configurado' });
  }
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'No autenticado' });
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return json(401, { error: 'Sesión no válida' });
  return { supabase, user };
}

// Cada paso de IA (investigación web y redacción) registra una fila en ai_usage
export async function checkDailyLimit({ supabase, user }: AuthContext): Promise<Response | null> {
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (profile?.is_admin) return null;
  const dailyLimit = Number(process.env.AI_DAILY_LIMIT) || 20;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('ai_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since);
  if (error) {
    console.error('ai_usage check failed:', error.message);
    return json(503, { error: 'No se pudo comprobar el límite de uso' });
  }
  if ((count ?? 0) >= dailyLimit) {
    return json(429, { error: 'Has alcanzado el límite diario de uso del asesor IA' });
  }
  return null;
}

export async function logUsage({ supabase, user }: AuthContext): Promise<void> {
  const { error } = await supabase.from('ai_usage').insert({ user_id: user.id });
  if (error) console.error('ai_usage insert failed:', error.message);
}

export function anthropicErrorResponse(error: unknown, route: string): Response {
  if (error instanceof Anthropic.RateLimitError) {
    return json(429, { error: 'Demasiadas peticiones, inténtalo en un minuto' });
  }
  if (error instanceof Anthropic.APIError) {
    console.error(`[${route}] Anthropic API error ${error.status}:`, error.message);
    return json(502, { error: `Error del servicio de IA (${error.status ?? 'sin código'})` });
  }
  console.error(`[${route}] error:`, error);
  return json(500, { error: 'Error interno' });
}
