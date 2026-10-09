import { supabase } from './supabase';
import { buildFestivalRoadmap, generateStrategy, platformCandidates, rankFestivalCandidates } from '../utils/strategyEngine';
import type { DistributionWindow, FilmData, RecommendedFestival, StrategyPhase, StrategyReport } from '../types/film';

const CANDIDATE_POOL = 40;

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
}

export interface GenerationResult {
  report: StrategyReport;
  aiError: string | null;
}

// La IA elabora el informe completo a partir de los festivales y plataformas de nuestra base de datos;
// el motor de reglas sirve de respaldo para cualquier sección que la IA devuelva vacía o si no responde.
export async function generateStrategyWithAI(
  filmData: FilmData,
  festivalsDb: RecommendedFestival[] | undefined,
): Promise<GenerationResult> {
  const base = generateStrategy(filmData, festivalsDb);
  const candidates = rankFestivalCandidates(filmData, festivalsDb, CANDIDATE_POOL);
  const platformPool = platformCandidates(filmData);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Sin sesión');

    const res = await fetch('/api/generate-strategy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
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
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null) as { error?: string } | null;
      throw new Error(body?.error ?? `Error ${res.status}`);
    }
    const advice = await res.json() as AdvisorResponse;

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
        aiGenerated: true,
      },
    };
  } catch (e) {
    return {
      report: { ...base, aiGenerated: false },
      aiError: e instanceof Error ? e.message : 'Error desconocido',
    };
  }
}
