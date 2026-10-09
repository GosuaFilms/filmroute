import { supabase } from './supabase';
import { buildFestivalRoadmap, generateStrategy, rankFestivalCandidates } from '../utils/strategyEngine';
import type { FilmData, RecommendedFestival, StrategyPhase, StrategyReport } from '../types/film';

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
}

export interface GenerationResult {
  report: StrategyReport;
  aiError: string | null;
}

// El motor de reglas aporta la parte factual (checklist, ventanas, plataformas, desglose)
// y sirve de respaldo si la IA no responde; la IA redacta el análisis y elige festivales.
export async function generateStrategyWithAI(
  filmData: FilmData,
  festivalsDb: RecommendedFestival[] | undefined,
): Promise<GenerationResult> {
  const base = generateStrategy(filmData, festivalsDb);
  const candidates = rankFestivalCandidates(filmData, festivalsDb, CANDIDATE_POOL);

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
