import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { createClient } from '@supabase/supabase-js';
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
- No prometas resultados (selecciones, ventas o ingresos garantizados).`;

interface RequestBody {
  filmData: unknown;
  candidates: { name: string }[];
  targetFestivalCount: number;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
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
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json(401, { error: 'Sesión no válida' });

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

  const client = new Anthropic();
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      output_config: {
        effort: 'medium',
        format: zodOutputFormat(AdvisorSchema),
      },
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content:
          `Fecha de hoy: ${new Date().toISOString().slice(0, 10)}\n` +
          `Número de festivales objetivo: ${targetCount}\n\n` +
          `<datos_pelicula>\n${JSON.stringify(body.filmData, null, 2)}\n</datos_pelicula>\n\n` +
          `<festivales_candidatos>\n${JSON.stringify(body.candidates, null, 2)}\n</festivales_candidatos>`,
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

    return json(200, advice);
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
