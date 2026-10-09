import { ApiError, apiPost } from './billing';
import { buildFestivalRoadmap, generateStrategy, platformCandidates, rankFestivalCandidates } from '../utils/strategyEngine';
import { FESTIVALS_DATABASE } from '../data/festivals';
import { PLATFORMS_DATABASE } from '../data/platforms';
import type { DistributionWindow, ExternalFestival, ExternalPlatform, FilmData, RecommendedFestival, StrategyPhase, StrategyReport } from '../types/film';

const CANDIDATE_POOL = 70;

interface AdvisorResponse {
  overallScore: number;
  scoreRationale: string;
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  risks: string[];
  festivals: { name: string; reason: string }[];
  marketingPhases: StrategyPhase[];
  nextSteps: string[];
  posterAnalysis: string;
  platforms: { name: string; probability: 'Alta' | 'Media' | 'Baja'; notes: string }[];
  distributionWindows: DistributionWindow[];
  budgetBreakdown: StrategyReport['budgetBreakdown'];
  deliverableChecklist: StrategyReport['deliverableChecklist'];
  externalFestivals: ExternalFestival[];
  externalPlatforms: ExternalPlatform[];
}

export type GenerationStage = 'research' | 'writing';

interface WebResearch {
  notes: string;
  sources: string[];
}

export interface PaymentRequired {
  code: string;
  message: string;
}

export type GenerationResult =
  | { report: StrategyReport; aiError: string | null; researchError: string | null; paymentRequired?: undefined }
  | { paymentRequired: PaymentRequired; report?: undefined; aiError?: undefined; researchError?: undefined };

// La IA elabora el informe completo a partir de los festivales y plataformas de nuestra base de datos;
// el motor de reglas sirve de respaldo para cualquier sección que la IA devuelva vacía o si no responde.
export async function generateStrategyWithAI(
  filmData: FilmData,
  festivalsDb: RecommendedFestival[] | undefined,
  strategyId: string,
  onStage?: (stage: GenerationStage) => void,
): Promise<GenerationResult> {
  const base = generateStrategy(filmData, festivalsDb);
  const candidates = rankFestivalCandidates(filmData, festivalsDb, CANDIDATE_POOL);
  const platformPool = platformCandidates(filmData);

  // Cada análisis se autoriza antes (licencia de la película, plan productora o administrador)
  let analysisId: string;
  try {
    ({ analysisId } = await apiPost<{ analysisId: string }>('/api/start-analysis', { strategyId }));
  } catch (e) {
    if (e instanceof ApiError && e.status === 402) {
      return { paymentRequired: { code: e.code ?? 'payment_required', message: e.message } };
    }
    return { report: { ...base, aiGenerated: false }, aiError: e instanceof Error ? e.message : 'Error desconocido', researchError: null };
  }

  try {
    // Fase 1: investigación web de oportunidades fuera de la base de datos. Si falla, se sigue sin ella.
    onStage?.('research');
    const knownFestivals = (festivalsDb && festivalsDb.length > 0 ? festivalsDb : FESTIVALS_DATABASE).map(f => f.name);
    let researchError: string | null = null;
    const research = await apiPost<WebResearch>('/api/research-opportunities', {
      analysisId,
      filmData,
      knownFestivals,
      knownPlatforms: PLATFORMS_DATABASE.map(p => p.name),
    }).catch(e => {
      researchError = e instanceof Error ? e.message : 'Error desconocido';
      console.warn('Investigación web no disponible:', researchError);
      return null;
    });
    if (research && !research.notes.trim()) researchError = 'la búsqueda no devolvió resultados';

    // Fase 2: redacción de la estrategia
    onStage?.('writing');
    const advice = await apiPost<AdvisorResponse>('/api/generate-strategy', {
      analysisId,
      filmData,
      candidates,
      platformCandidates: platformPool.map(p => ({
        name: p.name,
        type: p.type,
        territory: p.territory,
        submissionProcess: p.submissionProcess,
        revenueModel: p.revenueModel,
        notes: p.notes,
      })),
      targetFestivalCount: filmData.festivalStrategy.targetFestivalCount ?? 15,
      webResearch: research ?? undefined,
    });

    const byName = new Map(candidates.map(f => [f.name, f]));
    const festivals = advice.festivals
      .map(f => {
        const match = byName.get(f.name);
        return match ? { ...match, reason: f.reason } : null;
      })
      .filter((f): f is RecommendedFestival => f !== null);

    const platformByName = new Map(platformPool.map(p => [p.name, p]));
    const platforms: StrategyReport['recommendedPlatforms'] = [];
    for (const p of advice.platforms ?? []) {
      const match = platformByName.get(p.name);
      if (match) platforms.push({ name: p.name, type: match.type, territory: match.territory, probability: p.probability, notes: p.notes });
    }

    return {
      aiError: null,
      researchError,
      report: {
        ...base,
        overallScore: advice.overallScore,
        scoreRationale: advice.scoreRationale,
        executiveSummary: advice.executiveSummary,
        strengths: advice.strengths,
        weaknesses: advice.weaknesses,
        opportunities: advice.opportunities,
        risks: advice.risks,
        recommendedFestivals: festivals.length > 0 ? festivals : base.recommendedFestivals,
        festivalRoadmap: buildFestivalRoadmap(festivals.length > 0 ? festivals : base.recommendedFestivals),
        marketingPhases: advice.marketingPhases.length > 0 ? advice.marketingPhases : base.marketingPhases,
        nextSteps: advice.nextSteps,
        posterAnalysis: advice.posterAnalysis?.trim() || undefined,
        recommendedPlatforms: platforms.length > 0 ? platforms : base.recommendedPlatforms,
        distributionWindows: advice.distributionWindows?.length ? advice.distributionWindows : base.distributionWindows,
        budgetBreakdown: advice.budgetBreakdown?.length ? advice.budgetBreakdown : base.budgetBreakdown,
        deliverableChecklist: advice.deliverableChecklist?.length ? advice.deliverableChecklist : base.deliverableChecklist,
        externalFestivals: advice.externalFestivals ?? [],
        externalPlatforms: advice.externalPlatforms ?? [],
        aiGenerated: true,
      },
    };
  } catch (e) {
    return {
      report: { ...base, aiGenerated: false },
      aiError: e instanceof Error ? e.message : 'Error desconocido',
      researchError: null,
    };
  }
}
