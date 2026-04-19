import type {
  FilmData, StrategyReport, RecommendedFestival,
  StrategyPhase, DistributionWindow,
} from '../types/film';
import { FESTIVALS_DATABASE } from '../data/festivals';
import { PLATFORMS_DATABASE } from '../data/platforms';

function scoreFestivalMatch(festival: RecommendedFestival, data: FilmData): number {
  let score = 0;
  const { basicInfo, festivalStrategy, creativeDetails } = data;

  if (basicInfo.filmType && festival.acceptsTypes.includes(basicInfo.filmType)) score += 30;
  if (basicInfo.genre && festival.genres.includes(basicInfo.genre)) score += 25;

  const targetTiers = festivalStrategy.targetTiers ?? [];
  if (targetTiers.includes(festival.tier)) score += 20;

  const geoFocus = festivalStrategy.geographicFocus ?? [];
  if (geoFocus.some(g =>
    festival.country.toLowerCase().includes(g.toLowerCase()) ||
    g.toLowerCase().includes(festival.country.toLowerCase())
  )) score += 15;

  if (festivalStrategy.worldPremiereAvailable && festival.prestige > 85) score += 10;

  if (creativeDetails.awards && creativeDetails.awards.length > 10) score += 5;

  return score;
}

function getMaterialsScore(data: FilmData): number {
  const m = data.materials;
  if (!m) return 0;
  let score = 0;
  if (m.dcp === 'listo') score += 20;
  else if (m.dcp === 'en_proceso') score += 10;
  if (m.trailerTheatrical === 'listo') score += 15;
  else if (m.trailerTeaser === 'listo') score += 10;
  if (m.poster === 'listo') score += 10;
  if (m.pressKit === 'listo') score += 15;
  if (m.subtitleFiles === 'listo') score += 10;
  if (m.photoSet === 'listo') score += 10;
  if (m.musicRightsCleared) score += 5;
  if (m.archiveFootageCleared) score += 5;
  return Math.min(score, 100);
}

function getStrengths(data: FilmData): string[] {
  const strengths: string[] = [];
  const { basicInfo, materials, creativeDetails, festivalStrategy } = data;

  if (getMaterialsScore(data) >= 70) strengths.push('Materiales de distribución bien preparados');
  if (festivalStrategy.worldPremiereAvailable) strengths.push('Estreno mundial disponible — gran activo para festivales Tier A');
  if (creativeDetails.awards && creativeDetails.awards.length > 5) strengths.push('Historial de premios o selecciones previas');
  if (basicInfo.filmType === 'cortometraje') strengths.push('Formato cortometraje: circuito de festivales muy activo y accesible');
  if ((data.budgetResources.festivalsBudget ?? 0) > 3000) strengths.push('Presupuesto de festivales adecuado para una campaña amplia');
  if (materials.subtitleFiles === 'listo') strengths.push('Subtítulos disponibles: facilita acceso a mercados internacionales');
  if (materials.pressKit === 'listo') strengths.push('Press kit completo listo para medios y programadores');
  if (basicInfo.filmType === 'documental') strengths.push('Los documentales tienen ventanas de distribución muy variadas (TV, educativo, streaming)');

  return strengths.length > 0 ? strengths : ['Tu proyecto tiene potencial de distribución — completa más datos para análisis detallado'];
}

function getWeaknesses(data: FilmData): string[] {
  const weaknesses: string[] = [];
  const { materials, budgetResources } = data;

  if (getMaterialsScore(data) < 40) weaknesses.push('Materiales de distribución incompletos — priorizar DCP, tráiler y press kit');
  if (!materials.dcp || materials.dcp === 'no_disponible') weaknesses.push('Sin DCP: limitará inscripciones a festivales que requieren proyección en sala');
  if (!materials.trailerTeaser || materials.trailerTeaser === 'no_disponible') weaknesses.push('Sin tráiler: elemento clave para captación de interés en programadores y plataformas');
  if (!materials.pressKit || materials.pressKit === 'no_disponible') weaknesses.push('Sin press kit: dificulta la comunicación con medios especializados');
  if ((budgetResources.totalDistributionBudget ?? 0) < 3000) weaknesses.push('Presupuesto de distribución muy ajustado — priorizar festivales gratuitos y distribución digital DIY');
  if (!budgetResources.hasPublicist) weaknesses.push('Sin publicista: considera contratar uno para festivales Tier A');
  if (!materials.musicRightsCleared) weaknesses.push('Derechos de música no confirmados: puede bloquear distribución en plataformas');

  return weaknesses;
}

function getOpportunities(data: FilmData): string[] {
  const opps: string[] = [];
  const { basicInfo, distributionGoals, budgetResources } = data;

  if (basicInfo.filmType === 'cortometraje') opps.push('Clermont-Ferrand y Palm Springs ShortFest clasifican directamente para los Premios Oscar de cortometrajes');
  if (basicInfo.genre === 'documental_social' || basicInfo.filmType === 'documental') {
    opps.push('IDFA, Hot Docs y Sheffield DocFest tienen mercados activos de coproducción y distribución');
    opps.push('Arte y BBC son compradores activos de documentales de calidad');
  }
  if (basicInfo.genre === 'animacion') opps.push('Annecy es el festival de referencia — una selección allí abre puertas globalmente');
  if (basicInfo.genre === 'terror' || basicInfo.genre === 'ciencia_ficcion') opps.push('Sitges y Fantasia International son los festivales de género con mayor proyección comercial');
  if ((distributionGoals.geographicMarkets ?? []).includes('Latinoamérica')) opps.push('FICG Guadalajara y Bafici tienen mercados activos con compradores latinoamericanos');
  if (budgetResources.totalDistributionBudget && budgetResources.totalDistributionBudget > 10000) opps.push('Con el presupuesto disponible puedes cubrir una campaña de festivales internacional completa + lanzamiento digital');
  opps.push('MUBI y Filmin son plataformas accesibles para cineastas independientes sin distribuidora');
  opps.push('Vimeo On Demand permite distribución directa con 90% de revenue share para el creador');

  return opps;
}

function getRisks(data: FilmData): string[] {
  const risks: string[] = [];
  const { festivalStrategy, materials } = data;

  if (!festivalStrategy.worldPremiereAvailable && (festivalStrategy.currentPremiereStatus ?? '').length > 0) {
    risks.push('Estreno mundial ya realizado: algunos festivales Tier A no aceptan películas que han tenido premiere pública');
  }
  risks.push('Publicar en YouTube antes de completar el recorrido de festivales puede descalificar la película en muchos festivales');
  if (!materials.musicRightsCleared) risks.push('Música sin derechos claros puede impedir distribución en plataformas SVOD/AVOD');
  if (!materials.archiveFootageCleared) risks.push('Material de archivo sin clearance puede generar problemas legales en distribución internacional');
  risks.push('Los festivales Tier A son muy competitivos — preparar una estrategia Tier B como plan B sólido');
  if ((festivalStrategy.submissionBudget ?? 0) < 1000) risks.push('Presupuesto de inscripciones muy bajo — limita el número de festivales y afecta las opciones disponibles');

  return risks;
}

function recommendFestivals(data: FilmData): RecommendedFestival[] {
  const scored = FESTIVALS_DATABASE.map(f => ({
    festival: f,
    score: scoreFestivalMatch(f, data),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.festival.prestige - a.festival.prestige;
  });

  const maxFestivals = data.festivalStrategy.targetFestivalCount ?? 15;
  return scored.slice(0, maxFestivals).map(s => s.festival);
}

function buildFestivalRoadmap(festivals: RecommendedFestival[]): { month: string; festivals: string[] }[] {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const roadmap: { month: string; festivals: string[] }[] = [];

  months.forEach(month => {
    const inMonth = festivals.filter(f => f.month.includes(month));
    if (inMonth.length > 0) {
      roadmap.push({ month, festivals: inMonth.map(f => f.name) });
    }
  });

  return roadmap;
}

function buildMarketingPhases(data: FilmData): StrategyPhase[] {
  const budget = data.budgetResources.totalDistributionBudget ?? 0;
  const isShort = data.basicInfo.filmType === 'cortometraje';

  return [
    {
      phase: 'Fase 1: Preparación y materiales (Meses 1-2)',
      duration: '2 meses',
      actions: [
        'Finalizar DCP y masters técnicos',
        'Contratar diseñador gráfico para póster definitivo',
        'Redactar y maquetar press kit en español e inglés',
        'Producir tráiler teatral (2 min) y teaser (60 seg)',
        'Crear set de fotografías de producción y making of',
        'Registrar la obra en SGAE/DAMA para protección de derechos',
        'Crear página web oficial de la película',
        'Configurar perfiles en redes sociales (Instagram, X/Twitter)',
        isShort ? 'Abrir cuenta en FilmFreeway y Festhome' : 'Definir territorios prioritarios con agente de ventas',
      ],
      budget: budget > 0 ? `${Math.round(budget * 0.25).toLocaleString('es-ES')} €` : 'A definir',
      kpis: ['Press kit completado', 'DCP técnicamente validado', '500+ seguidores en RRSS', 'Página web activa'],
    },
    {
      phase: 'Fase 2: Campaña de festivales (Meses 3-12)',
      duration: '10 meses',
      actions: [
        'Enviar a festivales Tier A con deadline abierto (máx. 5 festivales premium)',
        'Campaña paralela en festivales Tier B especializados en el género',
        'Participar activamente en festivales: Q&A, networking con programadores',
        'Rueda de prensa en festivales relevantes',
        'Construir lista de contactos de distribuidores e interesados',
        'Documentar premios y selecciones para actualizar materiales de prensa',
        'Gestionar redes sociales durante festivales (stories, reels, actualizaciones)',
        'Enviar notas de prensa a medios especializados en cada selección',
      ],
      budget: budget > 0 ? `${Math.round(budget * 0.40).toLocaleString('es-ES')} €` : 'A definir',
      kpis: ['Mínimo 10 selecciones en festivales', '3+ premios o menciones', 'Cobertura en medios especializados', 'Contactos con distribuidores'],
    },
    {
      phase: 'Fase 3: Lanzamiento digital y plataformas (Meses 12-18)',
      duration: '6 meses',
      actions: [
        'Negociar acuerdos con plataformas SVOD (MUBI, Filmin, Amazon)',
        isShort ? 'Publicar en Vimeo Staff Picks y YouTube (con estrategia de monetización)' : 'Estreno en salas de arte y ensayo (opcional según resultados de festivales)',
        'Campaña de marketing digital (Meta Ads, Google Ads) focalizada',
        'Colaboraciones con influencers y críticos de cine',
        'Nota de prensa en medios generalistas para el lanzamiento',
        'Estrategia de email marketing a base de datos construida en festivales',
        'Explorar distribución educativa si el contenido lo permite',
      ],
      budget: budget > 0 ? `${Math.round(budget * 0.25).toLocaleString('es-ES')} €` : 'A definir',
      kpis: ['Acuerdo con mínimo 2 plataformas', '10.000+ visualizaciones primer mes', 'Cobertura en medios generalistas'],
    },
    {
      phase: 'Fase 4: Larga cola y derechos secundarios (Mes 18+)',
      duration: 'Continuo',
      actions: [
        'Negociar ventana de televisión (TV autonómica, canal temático)',
        'Explorar licencias educativas e institucionales',
        'Participar en mercados de cine (EFM, Cannes Marché, MipTV)',
        'Actualizar estrategia digital basándose en datos de audiencia',
        'Considerar distribución en territorios secundarios no cubiertos',
      ],
      budget: budget > 0 ? `${Math.round(budget * 0.10).toLocaleString('es-ES')} €` : 'A definir',
      kpis: ['Acuerdo de TV firmado', 'Recuperación del 30-50% de la inversión de distribución'],
    },
  ];
}

function buildDistributionWindows(data: FilmData): DistributionWindow[] {
  const isShort = data.basicInfo.filmType === 'cortometraje';
  const isDoc = data.basicInfo.filmType === 'documental';

  const windows: DistributionWindow[] = [
    {
      window: 'Festival',
      platform: 'Circuito internacional de festivales',
      timing: 'Meses 1-18 (según estrategia)',
      revenue: isShort ? 'Premios en metálico (100€–10.000€)' : 'Variable según festival',
      notes: 'Fase de construcción de reputación. Cero ingresos directos normalmente, pero esencial para ventas posteriores.',
    },
  ];

  if (!isShort) {
    windows.push({
      window: 'Estreno teatral',
      platform: 'Salas de cine (arte y ensayo)',
      timing: 'Meses 12-18 (post-festivales)',
      revenue: 'Variable. Taquilla compartida 50/50 con el cine',
      notes: 'Genera PR y legitima la película para plataformas. Recomendable aunque sea limitado.',
    });
  }

  windows.push(
    {
      window: 'SVOD Premium',
      platform: 'MUBI, Filmin, Netflix (si aplica)',
      timing: isShort ? 'Meses 6-12' : 'Meses 15-24',
      revenue: 'Desde 500€ hasta 50.000€+ según plataforma y territorio',
      notes: 'Ventana más valiosa para el cineasta independiente. Negocia territorios no solapados.',
    },
    {
      window: 'Streaming generalista',
      platform: 'Amazon Prime, Movistar+',
      timing: isShort ? 'Meses 12-18' : 'Meses 18-30',
      revenue: 'Revenue share o pago por licencia',
      notes: 'Mayor alcance de audiencia. Considera exclusividad territorial.',
    },
    {
      window: 'Televisión',
      platform: 'RTVE, TVE, Arte, canales temáticos',
      timing: 'Meses 18-36',
      revenue: 'Licencias desde 1.000€ hasta 30.000€ según canal y territorio',
      notes: isDoc ? 'Canal prioritario para documentales. Arte y BBC son compradores activos.' : 'Ingresos estables a largo plazo.',
    },
    {
      window: 'Distribución educativa',
      platform: 'Kanopy, DER, Icarus Films, universidades',
      timing: 'Meses 24+',
      revenue: 'Licencias institucionales recurrentes',
      notes: isDoc ? 'Altamente recomendado para documentales con valor pedagógico. Ingresos pasivos.' : 'Solo si el contenido es apropiado para contexto educativo.',
    },
    {
      window: 'Larga cola digital (VOD)',
      platform: 'Vimeo On Demand, iTunes, Google Play',
      timing: 'Meses 18+',
      revenue: 'Revenue share 70-90% para el cineasta',
      notes: 'Sin exclusividad. Mantén activa la película en plataformas transaccionales.',
    },
  );

  return windows;
}

function buildDeliverableChecklist(data: FilmData): StrategyReport['deliverableChecklist'] {
  const m = data.materials;
  return [
    { item: 'DCP (Digital Cinema Package)', status: m.dcp ?? 'no_disponible', priority: 'alta', deadline: 'Antes de primera inscripción en festival' },
    { item: 'ProRes / Master HD (1080p mínimo)', status: m.proRes ?? 'no_disponible', priority: 'alta', deadline: 'Antes de plataformas digitales' },
    { item: 'H.264 para screeners / envíos online', status: m.h264 ?? 'no_disponible', priority: 'alta', deadline: 'Inmediato' },
    { item: 'Tráiler teatral (1:30-2:30 min)', status: m.trailerTheatrical ?? 'no_disponible', priority: 'alta', deadline: 'Mes 1' },
    { item: 'Teaser (30-90 seg)', status: m.trailerTeaser ?? 'no_disponible', priority: 'media', deadline: 'Mes 1' },
    { item: 'Póster oficial (formato print y digital)', status: m.poster ?? 'no_disponible', priority: 'alta', deadline: 'Mes 1' },
    { item: 'Press kit en español e inglés', status: m.pressKit ?? 'no_disponible', priority: 'alta', deadline: 'Mes 1-2' },
    { item: 'Fotografías de producción (mín. 20 HQ)', status: m.photoSet ?? 'no_disponible', priority: 'media', deadline: 'Mes 1-2' },
    { item: 'Subtítulos en inglés (SRT/VTT)', status: m.subtitleFiles ?? 'no_disponible', priority: 'alta', deadline: 'Antes de primera inscripción internacional' },
    { item: 'Clearance de derechos musicales', status: m.musicRightsCleared ? 'listo' : 'no_disponible', priority: 'alta', deadline: 'Antes de distribución en plataformas' },
    { item: 'Clearance de material de archivo', status: m.archiveFootageCleared ? 'listo' : 'no_disponible', priority: 'alta', deadline: 'Antes de distribución internacional' },
    { item: 'Cuenta FilmFreeway activa', status: data.festivalStrategy.hasFilmFreewayAccount ? 'listo' : 'no_disponible', priority: 'alta', deadline: 'Inmediato' },
    { item: 'Página web oficial de la película', status: m.website ?? 'no_disponible', priority: 'media', deadline: 'Mes 1-2' },
    { item: 'Perfiles en redes sociales (Instagram, X)', status: m.socialMedia ?? 'no_disponible', priority: 'media', deadline: 'Mes 1' },
    { item: 'EPK (Electronic Press Kit) digital completo', status: m.pressKit ?? 'no_disponible', priority: 'media', deadline: 'Mes 2' },
    { item: 'Registro en SGAE/DAMA (derechos de autor)', status: 'no_disponible', priority: 'alta', deadline: 'Inmediato' },
    { item: 'BTS (Behind the Scenes) / Material complementario', status: m.bts ?? 'no_disponible', priority: 'baja', deadline: 'Mes 2-3' },
  ];
}

function buildBudgetBreakdown(data: FilmData): StrategyReport['budgetBreakdown'] {
  const total = data.budgetResources.totalDistributionBudget ?? 0;
  const isShort = data.basicInfo.filmType === 'cortometraje';

  const breakdown = [
    { category: 'Inscripciones a festivales', recommended: isShort ? Math.round(total * 0.25) : Math.round(total * 0.15), percentage: isShort ? 25 : 15 },
    { category: 'Producción de materiales (DCP, tráiler, póster)', recommended: Math.round(total * 0.20), percentage: 20 },
    { category: 'Press kit, EPK y comunicación', recommended: Math.round(total * 0.10), percentage: 10 },
    { category: 'Marketing digital (Ads, RRSS)', recommended: Math.round(total * 0.20), percentage: 20 },
    { category: 'Viajes y asistencia a festivales', recommended: Math.round(total * 0.15), percentage: 15 },
    { category: 'Subtítulos y traducciones', recommended: Math.round(total * 0.05), percentage: 5 },
    { category: 'Publicista / agente de prensa', recommended: Math.round(total * 0.10), percentage: 10 },
    { category: 'Reserva / imprevistos', recommended: Math.round(total * 0.05), percentage: 5 },
  ];

  return breakdown;
}

function buildExecutiveSummary(data: FilmData, festivals: RecommendedFestival[]): string {
  const title = data.basicInfo.title ?? 'tu película';
  const type = data.basicInfo.filmType ?? 'obra';
  const genre = data.basicInfo.genre ?? '';
  const budget = data.budgetResources.totalDistributionBudget ?? 0;

  const typeLabels: Record<string, string> = { cortometraje: 'cortometraje', largometraje: 'largometraje', documental: 'documental', mediometraje: 'mediometraje' };
  const typeLabel = typeLabels[type] ?? 'obra';

  return `"${title}" es un ${typeLabel}${genre ? ` de género ${genre}` : ''} con potencial real de distribución independiente. ` +
    `Basándonos en los datos introducidos, hemos identificado ${festivals.length} festivales relevantes y ` +
    `diseñado una estrategia en 4 fases que abarca desde la preparación de materiales hasta la explotación de derechos secundarios. ` +
    `${budget > 0 ? `Con un presupuesto de distribución de ${budget.toLocaleString('es-ES')}€, ` : ''}` +
    `la ruta recomendada prioriza el circuito de festivales como plataforma de visibilidad y validación antes del lanzamiento digital. ` +
    `Las plataformas MUBI y Filmin son las vías de distribución digital más accesibles sin distribuidora. ` +
    `La clave del éxito será la constancia en la campaña de festivales y la calidad de los materiales de comunicación.`;
}

export function generateStrategy(data: FilmData): StrategyReport {
  const festivals = recommendFestivals(data);
  const strengths = getStrengths(data);
  const weaknesses = getWeaknesses(data);
  const opportunities = getOpportunities(data);
  const risks = getRisks(data);

  const recommendedPlatforms = PLATFORMS_DATABASE
    .filter(p => {
      const minDur = p.minimumDuration ?? 0;
      const maxDur = p.maximumDuration ?? 999;
      const dur = data.basicInfo.duration ?? 0;
      if (dur > 0 && (dur < minDur || dur > maxDur)) return false;
      return true;
    })
    .slice(0, 10)
    .map(p => ({
      name: p.name,
      type: p.type,
      territory: p.territory,
      probability: p.prestige > 80 ? 'Media-Alta' : p.prestige > 60 ? 'Media' : 'Alta (DIY)',
      notes: p.notes,
    }));

  const nextSteps = [
    'Completar todos los materiales con prioridad "alta" del checklist de entregables',
    'Crear cuenta en FilmFreeway (www.filmfreeway.com) e importar los datos de la película',
    'Enviar a los 3 festivales Tier A más relevantes antes de que cierren sus deadlines',
    'Contactar a MUBI (submissions@mubi.com) y Filmin para explorar opciones de distribución digital',
    'Registrar la obra en SGAE o DAMA para proteger los derechos de autor',
    'Preparar presupuesto detallado siguiendo el desglose recomendado en este informe',
    'Unirse a grupos de distribución de cine independiente (AECINE, CIMA, cineastas.net)',
  ];

  return {
    filmTitle: data.basicInfo.title ?? 'Sin título',
    generatedAt: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
    overallScore: Math.min(
      Math.round((getMaterialsScore(data) * 0.4) + (strengths.length * 8) + (festivals.length > 10 ? 20 : 10)),
      100,
    ),
    strengths,
    weaknesses,
    opportunities,
    risks,
    recommendedFestivals: festivals,
    festivalRoadmap: buildFestivalRoadmap(festivals),
    marketingPhases: buildMarketingPhases(data),
    distributionWindows: buildDistributionWindows(data),
    recommendedPlatforms,
    deliverableChecklist: buildDeliverableChecklist(data),
    budgetBreakdown: buildBudgetBreakdown(data),
    totalBudgetEstimate: data.budgetResources.totalDistributionBudget ?? 0,
    executiveSummary: buildExecutiveSummary(data, festivals),
    nextSteps,
  };
}
