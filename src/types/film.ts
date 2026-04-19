export type FilmType = 'cortometraje' | 'largometraje' | 'documental' | 'mediometraje';
export type FilmGenre =
  | 'drama' | 'comedia' | 'thriller' | 'terror' | 'ciencia_ficcion'
  | 'animacion' | 'documental_social' | 'documental_naturaleza' | 'documental_historico'
  | 'romance' | 'aventura' | 'fantasia' | 'experimental' | 'musical' | 'biopic'
  | 'noir' | 'western' | 'otro';

export type DistributionTarget =
  | 'festivales' | 'salas_comerciales' | 'vod_svod' | 'television' | 'educativo' | 'online_gratuito';

export type FestivalTier = 'tier_a' | 'tier_b' | 'tier_c' | 'nacional' | 'regional';

export type MaterialStatus = 'listo' | 'en_proceso' | 'no_disponible';

export interface BasicInfo {
  title: string;
  originalTitle: string;
  filmType: FilmType;
  genre: FilmGenre;
  subgenre: string;
  duration: number;
  productionYear: number;
  country: string;
  coProducingCountries: string;
  originalLanguage: string;
  availableSubtitles: string[];
  productionCompany: string;
  directorName: string;
  producerName: string;
  website: string;
}

export interface CreativeDetails {
  shortSynopsis: string;
  longSynopsis: string;
  themes: string[];
  targetAudience: string;
  ageRating: string;
  notableCast: string;
  awards: string;
  previousScreenings: string;
  uniqueSellingPoint: string;
  visualStyle: string;
  inspirations: string;
}

export interface Materials {
  dcp: MaterialStatus;
  proRes: MaterialStatus;
  h264: MaterialStatus;
  trailerTeaser: MaterialStatus;
  trailerTheatrical: MaterialStatus;
  poster: MaterialStatus;
  pressKit: MaterialStatus;
  photoSet: MaterialStatus;
  bts: MaterialStatus;
  website: MaterialStatus;
  socialMedia: MaterialStatus;
  musicRightsCleared: boolean;
  archiveFootageCleared: boolean;
  subtitleFiles: MaterialStatus;
  dcpEncrypted: boolean;
  aspectRatio: string;
  audioFormat: string;
}

export interface DistributionGoals {
  primaryTargets: DistributionTarget[];
  geographicMarkets: string[];
  priorityMarket: string;
  wantsTheatrical: boolean;
  wantsStreaming: boolean;
  wantsTV: boolean;
  wantsEducational: boolean;
  expectedReleaseWindow: string;
  openToInternationalSales: boolean;
  languageVersionsNeeded: string;
}

export interface FestivalStrategy {
  worldPremiereAvailable: boolean;
  currentPremiereStatus: string;
  targetTiers: FestivalTier[];
  geographicFocus: string[];
  submissionBudget: number;
  targetFestivalCount: number;
  priorityFestivals: string[];
  avoidedFestivals: string;
  hasFilmFreewayAccount: boolean;
  submissionStrategy: 'exclusiva' | 'amplia' | 'selectiva';
  startDate: string;
}

export interface BudgetResources {
  totalDistributionBudget: number;
  festivalsBudget: number;
  marketingBudget: number;
  prBudget: number;
  translationBudget: number;
  deliverablesBudget: number;
  hasPublicist: boolean;
  hasSalesAgent: boolean;
  hasDistributor: boolean;
  teamSize: string;
  dedicatedHoursPerWeek: number;
  launchTimeline: string;
  additionalNotes: string;
}

export interface FilmData {
  basicInfo: Partial<BasicInfo>;
  creativeDetails: Partial<CreativeDetails>;
  materials: Partial<Materials>;
  distributionGoals: Partial<DistributionGoals>;
  festivalStrategy: Partial<FestivalStrategy>;
  budgetResources: Partial<BudgetResources>;
}

export interface RecommendedFestival {
  name: string;
  country: string;
  city: string;
  tier: FestivalTier;
  month: string;
  deadline: string;
  submissionFee: string;
  platform: string;
  url: string;
  genres: FilmGenre[];
  acceptsTypes: FilmType[];
  prestige: number;
  reason: string;
}

export interface StrategyPhase {
  phase: string;
  duration: string;
  actions: string[];
  budget: string;
  kpis: string[];
}

export interface DistributionWindow {
  window: string;
  platform: string;
  timing: string;
  revenue: string;
  notes: string;
}

export interface StrategyReport {
  filmTitle: string;
  generatedAt: string;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  risks: string[];
  recommendedFestivals: RecommendedFestival[];
  festivalRoadmap: { month: string; festivals: string[] }[];
  marketingPhases: StrategyPhase[];
  distributionWindows: DistributionWindow[];
  recommendedPlatforms: { name: string; type: string; territory: string; probability: string; notes: string }[];
  deliverableChecklist: { item: string; status: string; priority: 'alta' | 'media' | 'baja'; deadline: string }[];
  budgetBreakdown: { category: string; recommended: number; percentage: number }[];
  totalBudgetEstimate: number;
  executiveSummary: string;
  nextSteps: string[];
}
