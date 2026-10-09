import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const maxDuration = 300;

const MODEL = 'claude-opus-5-5';

const PhaseSchema = z.object({
  phase: z.string(),
  duration: z.string(),
  actions: z.array(z.string()),
  budget: z.string(),
  kpis: z.array(z.string()),
});

const AdvisorSchema = z.object({
  overallScore: z.number().int(),
  scoreRationale: z.string(),
  executiveSummary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  risks: z.array(z.string()),
  festivals: z.array(z.object({ name: z.string(), reason: z.string() })),
  marketingPhases: z.array(PhaseSchema),
  nextSteps: z.array(z.string()),
  posterAnalysis: z.string(),
  platforms: z.array(z.object({
    name: z.string(),
    probability: z.enum(['Alta', 'Media', 'Baja']),
    notes: z.string(),
  })),
  distributionWindows: z.array(z.object({
    window: z.string(),
    platform: z.string(),
    timing: z.string(),
    revenue: z.string(),
    notes: z.string(),
  })),
  budgetBreakdown: z.array(z.object({
    category: z.string(),
    amount: z.number(),
  })),
  deliverableChecklist: z.array(z.object({
    item: z.string(),
    status: z.enum(['listo', 'en_proceso', 'no_disponible']),
    priority: z.enum(['alta', 'media', 'baja']),
    deadline: z.string(),
  })),
});

const SYSTEM_PROMPT = `Eres el asesor de distribución de FilmRoute: un consultor senior de distribución de cine independiente con experiencia en festivales internacionales, agentes de ventas, plataformas (SVOD, AVOD, TVOD), televisión y distribución educativa, especialmente en el mercado español y europeo.

Recibirás los datos que un cineasta o productora ha rellenado sobre su película y una lista de festivales candidatos sacada de nuestra base de datos, con fechas, tasas y nivel. Tu trabajo es redactar una estrategia de distribución personalizada para ESA película concreta.

Reglas:
- Escribe en español de España, con tono profesional, directo y concreto. Nada de frases genéricas que valdrían para cualquier película: cada punto debe apoyarse en un dato concreto del proyecto (género, duración, estado de materiales, presupuesto, estreno, idioma, equipo, mercados).
- Festivales: elige SOLO de la lista de candidatos y copia el nombre exactamente como aparece. Nunca inventes festivales. Ordénalos de más a menos recomendable para esta película, respetando el número de festivales objetivo del cineasta. Para cada uno explica en 1-2 frases por qué encaja con esta película (no con cualquier película) y cualquier condición importante (estreno, deadline, sección adecuada).
- Ten en cuenta la estrategia de estrenos: no recomiendes una secuencia que queme el estreno mundial o nacional en un festival menor antes de uno mayor.
- Presupuesto: las cifras de las fases de marketing deben ser coherentes con el presupuesto total indicado (en euros). Si el presupuesto es 0 o muy bajo, propón una estrategia de bajo coste realista.
- overallScore (0-100) mide el potencial de distribución actual del proyecto teniendo en cuenta materiales, encaje con el circuito, presupuesto, equipo y estado del estreno. Explica la nota en scoreRationale en 2-3 frases.
- marketingPhases: entre 3 y 5 fases en orden cronológico, con acciones concretas y KPIs medibles.
- nextSteps: entre 5 y 8 acciones inmediatas ordenadas por urgencia. Cada una debe ser accionable esta semana o este mes y mencionar nombres concretos (festivales, plataformas, entregables) cuando aplique. No repitas tareas que el cineasta ya tiene hechas.
- Si faltan datos importantes, dilo en las debilidades en vez de suponerlos.
- No prometas resultados (selecciones, ventas o ingresos garantizados).
- platforms: elige entre 4 y 8 plataformas SOLO de <plataformas_candidatas> (nombre exacto). probability es la probabilidad realista de que ESTA película acceda a la plataforma con su situación actual (formato, duración, idioma, agente o distribuidora, ventanas ya comprometidas). En notes explica en 1-2 frases por qué y cómo acceder (vía directa, agregador, agente de ventas, momento de la ventana).
- distributionWindows: entre 4 y 7 ventanas de explotación en orden cronológico, adaptadas a esta película: usa fechas o meses concretos coherentes con el estado del estreno, la distribuidora y los acuerdos que figuren en los datos (por ejemplo, la ventana de la televisión participante). revenue: expectativa de ingresos realista y prudente; notes: condiciones clave (exclusividad, territorios, orden respecto a otras ventanas).
- budgetBreakdown: reparto recomendado del presupuesto total de distribución, entre 5 y 9 partidas con importes en euros enteros que sumen exactamente ese total, adaptadas a la estrategia (por ejemplo, campaña de premios, coloquios, subtítulos de idiomas concretos). Si las partidas que indica el cineasta son incoherentes, propón el reparto correcto. Si el presupuesto total es 0 o no consta, devuelve una lista vacía.
- deliverableChecklist: entre 10 y 18 entregables necesarios para ejecutar ESTA estrategia, incluidos los específicos que se deriven de ella (versiones subtituladas concretas, materiales para campañas de premios, guía didáctica, versión para televisión…). status según los datos facilitados (si no consta, no_disponible); priority según la urgencia en el calendario; deadline con una fecha o hito concreto.
- posterAnalysis: si se adjunta el cartel de la película, valóralo como herramienta de venta en 3-5 frases: legibilidad del título en miniatura (catálogos de festivales y plataformas), si transmite género y tono, coherencia con el público objetivo y la estrategia, y qué conviene ajustar (laureles tras las selecciones, bloque de créditos, versiones por territorio). Ten en cuenta el cartel también en el resto del análisis cuando sea relevante. Si no hay cartel, devuelve una cadena vacía.`;

interface RequestBody {
  filmData: unknown;
  candidates: { name: string }[];
  platformCandidates?: { name: string }[];
  targetFestivalCount: number;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Las partidas deben sumar exactamente el total declarado; los porcentajes se derivan de los importes
function normalizeBudget(items: { category: string; amount: number }[], total: number) {
  const valid = items.filter(i => i.category.trim() && Number.isFinite(i.amount) && i.amount > 0);
  const sum = valid.reduce((acc, i) => acc + i.amount, 0);
  if (total <= 0 || sum <= 0) return [];
  const scaled = valid.map(i => ({ category: i.category, recommended: Math.round((i.amount * total) / sum) }));
  const drift = total - scaled.reduce((acc, i) => acc + i.recommended, 0);
  if (drift !== 0) {
    const largest = scaled.reduce((a, b) => (b.recommended > a.recommended ? b : a));
    largest.recommended += drift;
  }
  return scaled.map(i => ({ ...i, percentage: Math.round((i.recommended / total) * 100) }));
}

// El cartel se descarga con el token del usuario: las políticas del bucket impiden leer carteles ajenos
async function loadPoster(
  supabase: SupabaseClient,
  userId: string,
  filmData: unknown,
): Promise<string | null> {
  const path = (filmData as { basicInfo?: { posterPath?: unknown } })?.basicInfo?.posterPath;
  if (typeof path !== 'string' || !path.startsWith(`${userId}/`)) return null;
  const { data: blob, error } = await supabase.storage.from('posters').download(path);
  if (error || !blob || blob.size > 4_500_000) return null;
  return Buffer.from(await blob.arrayBuffer()).toString('base64');
}

export async function POST(request: Request): Promise<Response> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !process.env.ANTHROPIC_API_KEY) {
    return json(500, { error: 'Servidor no configurado' });
  }

  // Solo usuarios autenticados pueden consumir créditos de IA
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'No autenticado' });
  // Cliente con el token del usuario para que las políticas RLS se apliquen en su nombre
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json(401, { error: 'Sesión no válida' });

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!profile?.is_admin) {
    const dailyLimit = Number(process.env.AI_DAILY_LIMIT) || 10;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: usageError } = await supabase
      .from('ai_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since);
    if (usageError) {
      console.error('ai_usage check failed:', usageError.message);
      return json(503, { error: 'No se pudo comprobar el límite de uso' });
    }
    if ((count ?? 0) >= dailyLimit) {
      return json(429, { error: `Has alcanzado el límite de ${dailyLimit} análisis con IA en 24 horas` });
    }
  }

  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return json(400, { error: 'JSON no válido' });
  }
  if (!body?.filmData || !Array.isArray(body.candidates) || body.candidates.length === 0) {
    return json(400, { error: 'Faltan datos de la película o festivales candidatos' });
  }
  const payloadSize = JSON.stringify(body).length;
  if (payloadSize > 200_000) return json(413, { error: 'Datos demasiado grandes' });

  const targetCount = Math.min(Math.max(Number(body.targetFestivalCount) || 12, 3), 25);

  const poster = await loadPoster(supabase, user.id, body.filmData);

  const client = new Anthropic();
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 20000,
      output_config: {
        effort: 'medium',
        format: zodOutputFormat(AdvisorSchema),
      },
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          ...(poster
            ? [{ type: 'image' as const, source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: poster } }]
            : []),
          {
            type: 'text' as const,
            text:
              `Fecha de hoy: ${new Date().toISOString().slice(0, 10)}\n` +
              `Número de festivales objetivo: ${targetCount}\n` +
              `Cartel adjunto: ${poster ? 'sí (imagen anterior)' : 'no'}\n\n` +
              `<datos_pelicula>\n${JSON.stringify(body.filmData, null, 2)}\n</datos_pelicula>\n\n` +
              `<festivales_candidatos>\n${JSON.stringify(body.candidates, null, 2)}\n</festivales_candidatos>\n\n` +
              `<plataformas_candidatas>\n${JSON.stringify(body.platformCandidates ?? [], null, 2)}\n</plataformas_candidatas>`,
          },
        ],
      }],
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return json(502, { error: 'El asesor IA no pudo generar la estrategia' });
    }

    const advice = response.parsed_output;
    const candidateNames = new Set(body.candidates.map(c => c.name));
    advice.festivals = advice.festivals
      .filter(f => candidateNames.has(f.name))
      .slice(0, targetCount);
    advice.overallScore = Math.min(Math.max(advice.overallScore, 0), 100);

    const platformNames = new Set((body.platformCandidates ?? []).map(p => p.name));
    advice.platforms = advice.platforms.filter(p => platformNames.has(p.name));

    const totalBudget = Number(
      (body.filmData as { budgetResources?: { totalDistributionBudget?: unknown } })?.budgetResources?.totalDistributionBudget,
    ) || 0;
    const budgetBreakdown = normalizeBudget(advice.budgetBreakdown, totalBudget);

    const { error: logError } = await supabase.from('ai_usage').insert({ user_id: user.id });
    if (logError) console.error('ai_usage insert failed:', logError.message);

    return json(200, { ...advice, budgetBreakdown });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return json(429, { error: 'Demasiadas peticiones, inténtalo en un minuto' });
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message);
      return json(502, { error: 'Error del servicio de IA' });
    }
    console.error('generate-strategy error:', error);
    return json(500, { error: 'Error interno' });
  }
}
