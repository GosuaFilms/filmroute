import Anthropic from '@anthropic-ai/sdk';
import { MODEL, anthropicErrorResponse, authorize, checkDailyLimit, claimAnalysisPhase, json, logUsage } from './_shared.js';

export const maxDuration = 300;

const MAX_CONTINUATIONS = 3;

const SYSTEM_PROMPT = `Eres el investigador de distribución de FilmRoute. Tu trabajo es buscar en la web oportunidades reales para una película concreta que NO estén ya en nuestra base de datos, para que el informe no pierda posibilidades.

Busca, según encaje con la película:
- Festivales: temáticos (por tema, género, formato o comunidad), regionales, iberoamericanos, de diáspora, de cine documental o de cine sobre cine, y secciones especiales de festivales grandes que acepten películas ya estrenadas.
- Mercados, foros o premios relevantes.
- Plataformas, televisiones o compradores que encajen y no estén en la lista.

Para cada oportunidad, comprueba en su web oficial la edición actual o la próxima: fechas de celebración, plazo de inscripción, tasa, requisitos de estreno y formato. Descarta las que tengan el plazo ya cerrado para la edición relevante o requisitos incompatibles con la situación de la película (por ejemplo, exigen estreno mundial y la película ya lo tuvo).

Responde en español con un informe en texto. Para cada oportunidad incluye: nombre, tipo (festival, mercado, plataforma o televisión), país y ciudad, fechas de la edición, plazo de inscripción, tasa, requisitos de estreno, por qué encaja con esta película y la URL oficial donde lo has comprobado. Incluye como máximo 10 festivales o mercados y 4 plataformas o televisiones, ordenados por interés. Si un dato no está publicado, escribe "Por confirmar". No incluyas nada que no hayas comprobado en la web.`;

interface RequestBody {
  analysisId: string;
  filmData: unknown;
  knownFestivals: string[];
  knownPlatforms: string[];
}

export async function POST(request: Request): Promise<Response> {
  const auth = await authorize(request);
  if (auth instanceof Response) return auth;
  const limited = await checkDailyLimit(auth);
  if (limited) return limited;

  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return json(400, { error: 'JSON no válido' });
  }
  if (!body?.filmData) return json(400, { error: 'Faltan datos de la película' });
  if (JSON.stringify(body).length > 200_000) return json(413, { error: 'Datos demasiado grandes' });
  const run = await claimAnalysisPhase(auth, body.analysisId, 'research_used');
  if (run instanceof Response) return run;

  const userText =
    `Fecha de hoy: ${new Date().toISOString().slice(0, 10)}\n\n` +
    `<datos_pelicula>\n${JSON.stringify(body.filmData, null, 2)}\n</datos_pelicula>\n\n` +
    `<ya_en_nuestra_base>\nFestivales: ${(body.knownFestivals ?? []).join('; ')}\n` +
    `Plataformas: ${(body.knownPlatforms ?? []).join('; ')}\n</ya_en_nuestra_base>`;

  const client = new Anthropic();
  try {
    const request_ = (history: Anthropic.MessageParam[]) => client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: 'medium' },
      system: SYSTEM_PROMPT,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 8 }],
      messages: history,
    });

    // El bucle de búsqueda del servidor puede pausarse; se reanuda reenviando lo producido hasta entonces
    // Sin reanudar si queda poco margen antes del límite de 300 s de la función
    const startedAt = Date.now();
    const collected: Anthropic.ContentBlock[] = [];
    let response = await request_([{ role: 'user', content: userText }]);
    collected.push(...response.content);
    for (let i = 0; i < MAX_CONTINUATIONS && response.stop_reason === 'pause_turn' && Date.now() - startedAt < 150_000; i++) {
      response = await request_([
        { role: 'user', content: userText },
        { role: 'assistant', content: collected },
      ]);
      collected.push(...response.content);
    }

    if (response.stop_reason === 'refusal') {
      return json(502, { error: 'La investigación web no está disponible' });
    }

    const notes = collected
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();
    const sources = new Set<string>();
    for (const block of collected) {
      if (block.type === 'text') {
        for (const c of block.citations ?? []) {
          if (c.type === 'web_search_result_location') sources.add(c.url);
        }
      }
    }

    await logUsage(auth);
    return json(200, { notes: notes.slice(0, 40_000), sources: [...sources].slice(0, 60) });
  } catch (error) {
    return anthropicErrorResponse(error, 'research-opportunities');
  }
}
