// Genera el informe de ejemplo de la página de inicio: película, equipo y datos ficticios;
// los festivales y plataformas salen de la base real con sus datos tal cual.
// Uso: npx tsx scripts/sample-report.mts
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { FESTIVALS_DATABASE } from '../src/data/festivals.ts';
import { PLATFORMS_DATABASE } from '../src/data/platforms.ts';
import { buildFestivalRoadmap } from '../src/utils/strategyEngine.ts';
import { exportReportToPDF } from '../src/utils/pdfExport.ts';
import type { FilmData, RecommendedFestival, StrategyReport } from '../src/types/film.ts';

const OUT_DIR = 'public/ejemplo';
const PDF_PATH = `${OUT_DIR}/informe-ejemplo-filmroute.pdf`;
const POSTER_PATH = `${OUT_DIR}/cartel-ceniza-de-agosto.jpg`;

interface ResearchRow {
  name: string; country: string; city: string; tier: RecommendedFestival['tier']; month: string; deadline: string;
  submission_fee: string; platform: string; url: string; genres: RecommendedFestival['genres'];
  accepts_types: RecommendedFestival['acceptsTypes']; prestige: number; reason: string;
}
const research = (JSON.parse(readFileSync('supabase/research/festivales_2026-10-09.json', 'utf8')) as ResearchRow[])
  .map((r): RecommendedFestival => ({
    name: r.name, country: r.country, city: r.city, tier: r.tier, month: r.month, deadline: r.deadline,
    submissionFee: r.submission_fee, platform: r.platform, url: r.url, genres: r.genres,
    acceptsTypes: r.accepts_types, prestige: r.prestige, reason: r.reason,
  }));
const allFestivals = [...FESTIVALS_DATABASE, ...research];

function festival(name: string, reason: string): RecommendedFestival {
  const f = allFestivals.find(x => x.name === name);
  if (!f) throw new Error(`Festival no encontrado en la base: ${name}`);
  return { ...f, reason };
}

function platform(name: string, probability: 'Alta' | 'Media' | 'Baja', notes: string) {
  const p = PLATFORMS_DATABASE.find(x => x.name === name);
  if (!p) throw new Error(`Plataforma no encontrada en la base: ${name}`);
  return { name, type: p.type, territory: p.territory, probability, notes };
}

const filmData: FilmData = {
  basicInfo: {
    title: 'Ceniza de agosto', originalTitle: 'Cinza de agosto', filmType: 'largometraje', genre: 'drama',
    duration: 98, productionYear: 2026, country: 'España', coProducingCountries: 'Portugal',
    originalLanguage: 'Gallego y castellano', directorName: 'Iria Montenegro', productionCompany: 'Lucerna Films',
  },
  creativeDetails: {}, materials: {}, distributionGoals: {}, festivalStrategy: {}, budgetResources: {},
};

const festivals: RecommendedFestival[] = [
  festival('Berlinale (Festival de Berlín)', 'Es la mejor opción para el estreno mundial: la sección Perspectives está dedicada a óperas primas y Panorama acoge dramas de autor con mirada social como este. El plazo cierra en noviembre, así que la candidatura debe salir este mes con la copia de trabajo subtitulada al inglés.'),
  festival('Karlovy Vary IFF', 'Plan B del estreno mundial si Berlín no la selecciona. Su competición Proxima busca autoras emergentes y el plazo llega hasta marzo, de modo que se puede esperar a la respuesta de Berlín sin perder la ventana.'),
  festival('European Film Market (Berlín)', 'No exige estreno: es el lugar para cerrar un agente de ventas internacional, la gran carencia del proyecto. Conviene acreditarse con tarifa temprana y llevar tráiler y one-sheet en inglés aunque la película no esté en la Berlinale.'),
  festival('Festival de Málaga — Cine en Español', 'Estreno en España en marzo, compatible con un estreno mundial en Berlín. La sección oficial encaja con una ópera prima española con reparto gallego y daría visibilidad ante distribuidoras nacionales.'),
  festival('San Sebastián Zinemaldia', 'Alternativa al eje Berlín-Málaga: New Directors acoge óperas primas en estreno mundial o internacional y es la plataforma natural para una película del norte. Retrasaría el estreno comercial a finales de 2027.'),
  festival('Guadalajara (FICG)', 'Puerta al mercado latinoamericano y a los Premios Platino. Exige estreno en México, compatible con todo lo anterior. Inscripción gratuita en noviembre-diciembre.'),
  festival('Festival de Cine Español de Nantes', 'Escaparate del cine español en Francia, mercado clave por la coproducción con Portugal y la sensibilidad francesa hacia el cine rural de autor. Requiere subtítulos en francés antes del 1 de diciembre.'),
  festival('Sarajevo Film Festival', 'Encaja con el tema (comunidades rurales y crisis climática) y es punto de encuentro de compradores de Europa del Este. Buen festival de verano tras el estreno mundial.'),
  festival('Seminci (Valladolid)', 'Si el estreno español no se hace en Málaga, Seminci acoge dramas europeos de autor en otoño. Requiere estreno en España.'),
  festival('Ourense Film Festival (OUFF)', 'El festival gallego de referencia antes del estreno comercial: da prensa en Galicia y prepara la candidatura a los Mestre Mateo. Exige que la película no se haya estrenado en salas.'),
  festival('Novos Cinemas (Pontevedra)', 'Festival especializado en óperas primas y segundas obras, en la comunidad donde se rodó. Prioriza el estreno en Galicia, compatible si el estreno español es en Málaga.'),
  festival('Festival de Cine Iberoamericano de Huelva', 'Opción para el recorrido nacional de otoño en la sección de producción española; no admite películas distribuidas en salas, así que debe ir antes del estreno comercial.'),
  festival('Cinespaña (Toulouse)', 'Complementa Nantes en el mercado francés con una competición de ficción española y portuguesa, donde la coproducción con Portugal suma. Inscripción gratuita en verano.'),
  festival('Festival Internacional de Cine de Mar del Plata', 'Único festival de categoría A de Latinoamérica: con estreno en Argentina en noviembre, cierra el recorrido internacional del primer año y refuerza la venta a Latinoamérica.'),
  festival('Premios Mestre Mateo', 'Premios de la Academia Galega do Audiovisual: la película es elegible en longametraxe y en las categorías técnicas e interpretativas. Inscripción en septiembre del año del estreno.'),
  festival('Goya — Academia de Cine (España)', 'Candidatura a Mejor Dirección Novel y a Actriz Revelación para Antía Regueiro una vez estrenada en salas. Es el mayor multiplicador de la vida comercial de una ópera prima.'),
  festival('Premios Feroz', 'La prensa especializada valora las óperas primas de autor; complementa la campaña de los Goya con un coste bajo si se habilita el visionado en VEOFEROZ.'),
];

const report: StrategyReport = {
  filmTitle: 'Ceniza de agosto',
  generatedAt: '9 de octubre de 2026',
  overallScore: 74,
  scoreRationale: 'Película terminada con DCP, subtítulos en inglés y el estreno mundial intacto, lo que abre la puerta a festivales de primer nivel. El tema (una aldea gallega cercada por los incendios) es actual y viaja bien fuera de España. La nota baja porque todavía no hay agente de ventas ni distribuidora en España, el tráiler y el press kit están en proceso y el presupuesto de 25.000 € obliga a elegir bien dónde estrenar.',
  executiveSummary: 'Ceniza de agosto es una ópera prima con un activo poco frecuente: el estreno mundial sigue disponible y la película ya está terminada. Toda la estrategia gira en torno a no gastarlo mal. La prioridad es presentar la candidatura a la Berlinale este mes, con Karlovy Vary como plan B, y usar el European Film Market para cerrar un agente de ventas, la gran carencia del proyecto. En España, el estreno debe ir a Málaga en marzo y la película debe llegar a salas en otoño de 2027 de la mano de una distribuidora de cine de autor, con Galicia como base y pases con coloquio. La campaña de premios (Mestre Mateo, Feroz y Goya en dirección novel) es el principal multiplicador de su vida comercial. Fuera de España, Francia (Nantes, Cinespaña) y Latinoamérica (Guadalajara, Mar del Plata) son los mercados con más encaje.',
  posterAnalysis: 'El cartel funciona: la paleta de brasa y la silueta sobre la cresta transmiten el conflicto sin necesidad de texto, y el título en serifa grande se lee bien en miniatura. La protagonista ocupa muy poco espacio: para plataformas conviene una variante vertical más cerrada sobre la figura. Falta reservar un hueco para los laureles de los festivales y preparar una versión internacional con el título en inglés (Ashes of August) y el bloque de créditos según las exigencias del agente de ventas.',
  strengths: [
    'Estreno mundial disponible y película terminada: puede optar a Berlinale, Karlovy Vary o San Sebastián sin depender de plazos de posproducción.',
    'Tema de actualidad internacional (incendios, despoblación rural, crisis climática) contado desde una historia familiar íntima.',
    'DCP y subtítulos en inglés listos: se puede inscribir en festivales internacionales esta misma semana.',
    'Coproducción con Portugal: abre ayudas, festivales y televisiones portuguesas, y suma en los festivales de cine ibérico de Francia.',
    'Rodada en gallego y castellano: elegible en los Mestre Mateo y atractiva para la televisión autonómica.',
  ],
  weaknesses: [
    'Sin agente de ventas internacional: los festivales de primer nivel y los compradores esperan un interlocutor profesional.',
    'Sin distribuidora en España ni fecha de estreno comercial.',
    'Tráiler y press kit en proceso: son imprescindibles para las candidaturas de noviembre.',
    'Presupuesto de distribución ajustado (25.000 €) para cubrir festivales internacionales, campaña de premios y lanzamiento en salas.',
    'Directora y reparto sin trayectoria previa: la película tiene que abrirse camino por su calidad y por el tema.',
  ],
  opportunities: [
    'Berlinale Perspectives, la competición para óperas primas, encaja con el perfil de la película.',
    'El European Film Market de febrero permite reunirse con agentes de ventas aunque la película no esté seleccionada.',
    'El interés de las plataformas europeas y de las televisiones culturales por el cine sobre la crisis climática.',
    'Pases con coloquio en Galicia y con colectivos de bomberos forestales y desarrollo rural, con potencial de prensa local.',
    'La categoría de Mejor Dirección Novel en los Goya y el premio a la mejor ópera prima en los Feroz.',
  ],
  risks: [
    'Aceptar un festival menor antes de Berlín o Karlovy Vary quemaría el estreno mundial.',
    'Si Berlín y Karlovy Vary no la seleccionan, el calendario se alarga hasta San Sebastián y el estreno comercial se retrasa un año.',
    'Gastar el presupuesto en inscripciones de baja probabilidad antes de cerrar la estrategia de estreno.',
    'Que una distribuidora pida exclusividad de festivales en España incompatible con Ourense o Novos Cinemas.',
  ],
  recommendedFestivals: festivals,
  festivalRoadmap: buildFestivalRoadmap(festivals),
  marketingPhases: [
    {
      phase: 'Candidaturas de estreno mundial', duration: 'Octubre – noviembre de 2026',
      budget: '3.500 € (tráiler 1.800 €, press kit y fotos 900 €, inscripciones 800 €)',
      actions: [
        'Cerrar el tráiler internacional y el press kit en inglés antes del 31 de octubre.',
        'Presentar la candidatura a la Berlinale (Perspectives y Panorama) con la copia de trabajo subtitulada.',
        'Preparar la candidatura a Karlovy Vary para enviarla en cuanto llegue la respuesta de Berlín.',
        'Acreditarse en el European Film Market con tarifa temprana.',
        'No aceptar invitaciones de festivales que exijan estreno mundial o internacional mientras esté abierta Berlín.',
      ],
      kpis: ['Candidatura a la Berlinale enviada antes de que cierre el plazo', 'Tráiler y press kit terminados', 'Acreditación del EFM confirmada'],
    },
    {
      phase: 'Agente de ventas y estreno mundial', duration: 'Diciembre de 2026 – julio de 2027',
      budget: '6.500 € (EFM y viajes 3.000 €, estreno mundial 2.500 €, materiales de ventas 1.000 €)',
      actions: [
        'Enviar el screener a 15–20 agentes de ventas especializados en ópera prima europea.',
        'Agenda de reuniones en el EFM con agentes, distribuidoras españolas y televisiones portuguesas.',
        'Estreno mundial en Berlín (febrero) o en Karlovy Vary (julio), con la directora y la protagonista.',
        'Estreno en España en Málaga (marzo) si el mundial es en Berlín.',
      ],
      kpis: ['Agente de ventas firmado antes del estreno mundial', 'Al menos 20 reuniones en el EFM', 'Selección en un festival de categoría A o en Málaga'],
    },
    {
      phase: 'Recorrido de festivales', duration: 'Marzo – diciembre de 2027',
      budget: '4.000 € (inscripciones 1.200 €, subtítulos en francés y portugués 1.300 €, viajes 1.500 €)',
      actions: [
        'Francia: Nantes y Cinespaña. Latinoamérica: Guadalajara y Mar del Plata, coordinado con el agente.',
        'Galicia: Ourense o Novos Cinemas como lanzamiento autonómico antes del estreno en salas.',
        'Sarajevo en agosto para el mercado de Europa del Este.',
      ],
      kpis: ['Al menos 6 selecciones internacionales', 'Prensa en Francia y Latinoamérica', 'Un premio o mención'],
    },
    {
      phase: 'Estreno en salas y campaña de premios', duration: 'Octubre de 2027 – febrero de 2028',
      budget: '9.000 € (lanzamiento en salas 5.500 €, campaña de premios 2.500 €, pases con coloquio 1.000 €)',
      actions: [
        'Estreno con distribuidora de cine de autor: Galicia, Madrid y Barcelona en V.O.S.E., y ampliación según la media por copia.',
        'Gira de pases con coloquio en Galicia, también con colectivos de bomberos forestales y asociaciones rurales.',
        'Candidaturas a los Goya (Dirección Novel, Actriz Revelación), Feroz y Mestre Mateo.',
      ],
      kpis: ['Al menos 15 salas en el estreno', '10.000 espectadores', 'Una nominación en premios nacionales'],
    },
    {
      phase: 'Plataformas y televisión', duration: 'Marzo – diciembre de 2028',
      budget: '2.000 € (materiales técnicos y versiones para emisión)',
      actions: [
        'Licencia de suscripción en España (Filmin o Movistar+) tras la ventana de salas.',
        'Venta a la Televisión de Galicia y a una televisión portuguesa.',
        'Ventas internacionales a plataformas y televisiones culturales a través del agente.',
      ],
      kpis: ['Un acuerdo de suscripción en España', 'Venta a televisión en Galicia y Portugal', 'Ventas en al menos 3 territorios'],
    },
  ],
  distributionWindows: [
    { window: 'Festivales y mercados', platform: 'Berlinale o Karlovy Vary, Málaga, EFM', timing: 'Febrero – diciembre de 2027', revenue: 'Sin ingresos directos; visibilidad y agente de ventas', notes: 'Proteger el estreno mundial hasta la respuesta de Berlín.' },
    { window: 'Salas en España', platform: 'Distribuidora de cine de autor (V.O.S.E.)', timing: 'Octubre de 2027', revenue: 'Prudente: entre 40.000 y 90.000 € de taquilla bruta', notes: 'Galicia como base, con pases con coloquio. Coordinar con la campaña de premios.' },
    { window: 'Alquiler y venta digital', platform: 'Filmin, Movistar+ y Prime Video', timing: 'Enero – febrero de 2028', revenue: 'Entre 3.000 y 8.000 € el primer año', notes: 'Aprovechar el eco de las nominaciones.' },
    { window: 'Suscripción en España', platform: 'Filmin o Movistar+', timing: 'Marzo de 2028', revenue: 'Licencia estimada de 10.000 a 25.000 €', notes: 'Negociar exclusividad limitada en el tiempo.' },
    { window: 'Televisión', platform: 'Televisión de Galicia y televisión portuguesa', timing: 'Segundo semestre de 2028', revenue: 'Entre 8.000 y 20.000 € en conjunto', notes: 'Versión en gallego para la emisión autonómica.' },
    { window: 'Ventas internacionales', platform: 'Agente de ventas: plataformas y televisiones culturales', timing: '2027 – 2029', revenue: 'Mínimos garantizados variables según el territorio', notes: 'Francia, Portugal, Latinoamérica y Europa del Este como prioridad.' },
  ],
  recommendedPlatforms: [
    platform('Filmin', 'Alta', 'Destino natural en España y Portugal para una ópera prima de autor con recorrido de festivales; además programa ciclos sobre cine gallego.'),
    platform('Movistar+', 'Media', 'Compra cine español con nominaciones o recorrido destacado; la posibilidad depende de la campaña de premios.'),
    platform('Arte', 'Media', 'El tema climático y la coproducción europea encajan con su línea; se accede a través del agente de ventas.'),
    platform('MUBI', 'Media', 'Selecciona óperas primas de autor que pasan por festivales de categoría A; un estreno en la Berlinale lo hace viable.'),
    platform('Amazon Prime Video', 'Media', 'Ventana de alquiler y venta en España a través de la distribuidora, y posible licencia en Latinoamérica.'),
    platform('Plataforma de Cine Español (PCE)', 'Media', 'Vía institucional para Latinoamérica una vez estrenada en España.'),
    platform('Netflix', 'Baja', 'Solo si la película logra premios importantes o un gran resultado en salas; licencia para España o Latinoamérica a través del agente.'),
  ],
  deliverableChecklist: [
    { item: 'DCP 2K con subtítulos en inglés', status: 'listo', priority: 'alta', deadline: 'Disponible' },
    { item: 'Tráiler internacional (2 min) y teaser', status: 'en_proceso', priority: 'alta', deadline: '31 de octubre de 2026' },
    { item: 'Press kit en inglés y castellano', status: 'en_proceso', priority: 'alta', deadline: '31 de octubre de 2026' },
    { item: 'Screener protegido con marca de agua', status: 'no_disponible', priority: 'alta', deadline: '20 de octubre de 2026' },
    { item: 'Fotos fijas en alta resolución', status: 'listo', priority: 'media', deadline: 'Disponible' },
    { item: 'Subtítulos en francés', status: 'no_disponible', priority: 'media', deadline: '1 de diciembre de 2026 (Nantes)' },
    { item: 'Subtítulos en portugués', status: 'no_disponible', priority: 'media', deadline: 'Marzo de 2027' },
    { item: 'Cartel internacional (Ashes of August)', status: 'no_disponible', priority: 'media', deadline: 'Enero de 2027 (EFM)' },
    { item: 'Pista internacional de música y efectos', status: 'no_disponible', priority: 'media', deadline: 'Antes de firmar con el agente' },
    { item: 'Cadena de derechos y licencias de música', status: 'en_proceso', priority: 'alta', deadline: 'Antes del EFM' },
    { item: 'Subtítulos para personas sordas y audiodescripción', status: 'no_disponible', priority: 'media', deadline: 'Antes del estreno en salas' },
    { item: 'Web oficial y redes sociales', status: 'en_proceso', priority: 'baja', deadline: 'Febrero de 2027' },
  ],
  budgetBreakdown: [
    { category: 'Lanzamiento en salas (publicidad, cartelería, copias)', recommended: 5500, percentage: 22 },
    { category: 'Mercados y viajes (EFM, estreno mundial, festivales)', recommended: 5500, percentage: 22 },
    { category: 'Tráiler, press kit y materiales de ventas', recommended: 3700, percentage: 15 },
    { category: 'Campaña de premios (Goya, Feroz, Mestre Mateo)', recommended: 2500, percentage: 10 },
    { category: 'Subtítulos y accesibilidad', recommended: 2300, percentage: 9 },
    { category: 'Inscripciones en festivales', recommended: 2000, percentage: 8 },
    { category: 'Pases con coloquio', recommended: 1500, percentage: 6 },
    { category: 'Materiales técnicos para televisión y plataformas', recommended: 2000, percentage: 8 },
  ],
  totalBudgetEstimate: 25000,
  nextSteps: [
    'Esta semana: encargar el screener protegido y cerrar el tráiler internacional para la candidatura a la Berlinale.',
    'Antes de que cierre el plazo de noviembre: enviar la candidatura a Berlinale Perspectives y Panorama.',
    'Este mes: acreditarse en el European Film Market con tarifa temprana y preparar la lista de 20 agentes de ventas.',
    'Este mes: rechazar cualquier invitación que exija estreno mundial o internacional mientras Berlín no responda.',
    'Antes del 1 de diciembre: subtítulos en francés e inscripción en el Festival de Cine Español de Nantes.',
    'Noviembre-diciembre: inscribir la película en Guadalajara (gratuito) y preparar Málaga.',
    'Enero: decidir entre Karlovy Vary y San Sebastián según la respuesta de Berlín.',
    'Durante el EFM: reunirse con distribuidoras españolas de cine de autor para fijar el estreno en salas de otoño de 2027.',
  ],
  aiGenerated: true,
  externalFestivals: [],
  externalPlatforms: [],
};

// En Node, jsPDF descarga las fuentes y save() se sustituye por escribir el archivo
const { jsPDF } = await import('jspdf');
(jsPDF as unknown as { API: Record<string, unknown> }).API.save = function (this: { output: (t: string) => ArrayBuffer }) {
  writeFileSync(PDF_PATH, Buffer.from(this.output('arraybuffer')));
};
mkdirSync(OUT_DIR, { recursive: true });
const posterJpg = readFileSync(POSTER_PATH);
const poster = { dataUrl: `data:image/jpeg;base64,${posterJpg.toString('base64')}`, width: 1000, height: 1480 };
await exportReportToPDF(report, filmData, poster, { sample: true });
console.log(`Informe de ejemplo: ${PDF_PATH}`);
