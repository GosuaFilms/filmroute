import type { FilmData } from '../../types/film';
import { formatEuro } from '../../utils/format';
import { Film, Globe, Award, Package, Target, DollarSign, Pencil } from 'lucide-react';

interface Props {
  data: FilmData;
  onGenerate: () => void;
  isGenerating: boolean;
  onEditStep: (step: number) => void;
}

interface ReviewRowProps {
  label: string;
  value?: string | number | boolean | string[];
}

function ReviewRow({ label, value }: ReviewRowProps) {
  if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value);
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-cinema-border/50 last:border-0">
      <span className="text-xs text-cinema-text-dim">{label}</span>
      <span className="text-xs text-cinema-text font-medium text-right max-w-xs">{display}</span>
    </div>
  );
}

interface ReviewSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  onEdit: () => void;
}

function ReviewSection({ icon, title, children, onEdit }: ReviewSectionProps) {
  return (
    <div className="bg-cinema-card border border-cinema-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-cinema-border bg-cinema-dark/50">
        <span className="text-cinema-gold">{icon}</span>
        <h3 className="text-sm font-semibold text-cinema-text flex-1">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs text-cinema-text-dim hover:text-cinema-gold border border-cinema-border hover:border-cinema-gold/50 rounded-md px-2 py-1 transition-all"
        >
          <Pencil size={11} /> Editar
        </button>
      </div>
      <div className="px-4 py-3 space-y-0">{children}</div>
    </div>
  );
}

export function Step7Review({ data, onGenerate, isGenerating, onEditStep }: Props) {
  const { basicInfo: b, creativeDetails: c, materials: m, distributionGoals: d, festivalStrategy: f, budgetResources: br } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-cinema-text mb-1">Revisión y generación de estrategia</h2>
        <p className="text-cinema-text-dim text-sm">Revisa los datos introducidos y genera tu informe de distribución personalizado. Pulsa «Editar» en cualquier bloque para corregirlo.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ReviewSection icon={<Film size={16} />} title="Información básica" onEdit={() => onEditStep(1)}>
          <ReviewRow label="Título" value={b.title} />
          <ReviewRow label="Tipo" value={b.filmType} />
          <ReviewRow label="Género" value={b.genre} />
          <ReviewRow label="Duración" value={b.duration ? `${b.duration} min` : undefined} />
          <ReviewRow label="País" value={b.country} />
          <ReviewRow label="Director/a" value={b.directorName} />
          <ReviewRow label="Idioma original" value={b.originalLanguage} />
          <ReviewRow label="Subtítulos" value={b.availableSubtitles} />
          <ReviewRow label="Cartel" value={b.posterPath ? 'Subido' : 'No subido'} />
        </ReviewSection>

        <ReviewSection icon={<Award size={16} />} title="Detalles creativos" onEdit={() => onEditStep(2)}>
          <ReviewRow label="Público objetivo" value={c.targetAudience} />
          <ReviewRow label="Clasificación" value={c.ageRating} />
          <ReviewRow label="Temáticas" value={c.themes} />
          <ReviewRow label="Premios/selecciones" value={c.awards ? 'Sí (detallado en formulario)' : undefined} />
          <ReviewRow label="USP definido" value={c.uniqueSellingPoint ? 'Sí' : 'No'} />
        </ReviewSection>

        <ReviewSection icon={<Package size={16} />} title="Estado de materiales" onEdit={() => onEditStep(3)}>
          <ReviewRow label="DCP" value={m.dcp} />
          <ReviewRow label="Tráiler teatral" value={m.trailerTheatrical} />
          <ReviewRow label="Póster oficial" value={m.poster} />
          <ReviewRow label="Press kit" value={m.pressKit} />
          <ReviewRow label="Subtítulos (archivos)" value={m.subtitleFiles} />
          <ReviewRow label="Derechos musicales" value={m.musicRightsCleared} />
          <ReviewRow label="Sitio web" value={m.website} />
        </ReviewSection>

        <ReviewSection icon={<Globe size={16} />} title="Objetivos de distribución" onEdit={() => onEditStep(4)}>
          <ReviewRow label="Canales objetivo" value={d.primaryTargets} />
          <ReviewRow label="Mercados" value={d.geographicMarkets} />
          <ReviewRow label="Mercado prioritario" value={d.priorityMarket} />
          <ReviewRow label="Estreno en salas" value={d.wantsTheatrical} />
          <ReviewRow label="Plataformas streaming" value={d.wantsStreaming} />
          <ReviewRow label="Televisión" value={d.wantsTV} />
          <ReviewRow label="Ventas internacionales" value={d.openToInternationalSales} />
        </ReviewSection>

        <ReviewSection icon={<Award size={16} />} title="Estrategia de festivales" onEdit={() => onEditStep(5)}>
          <ReviewRow label="Estreno mundial disponible" value={f.worldPremiereAvailable} />
          <ReviewRow label="Estado actual" value={f.currentPremiereStatus} />
          <ReviewRow label="Tiers objetivo" value={f.targetTiers} />
          <ReviewRow label="Enfoque geográfico" value={f.geographicFocus} />
          <ReviewRow label="Festivales objetivo" value={f.targetFestivalCount ? `${f.targetFestivalCount} festivales` : undefined} />
          <ReviewRow label="Cuenta FilmFreeway" value={f.hasFilmFreewayAccount} />
          <ReviewRow label="Estrategia de envío" value={f.submissionStrategy} />
        </ReviewSection>

        <ReviewSection icon={<DollarSign size={16} />} title="Presupuesto y recursos" onEdit={() => onEditStep(6)}>
          <ReviewRow label="Presupuesto total" value={br.totalDistributionBudget ? formatEuro(br.totalDistributionBudget) : undefined} />
          <ReviewRow label="Presupuesto festivales" value={br.festivalsBudget ? formatEuro(br.festivalsBudget) : undefined} />
          <ReviewRow label="Presupuesto marketing" value={br.marketingBudget ? formatEuro(br.marketingBudget) : undefined} />
          <ReviewRow label="Equipo" value={br.teamSize} />
          <ReviewRow label="Tiene publicista" value={br.hasPublicist} />
          <ReviewRow label="Tiene sales agent" value={br.hasSalesAgent} />
          <ReviewRow label="Tiene distribuidora" value={br.hasDistributor} />
          <ReviewRow label="Timeline" value={br.launchTimeline} />
        </ReviewSection>
      </div>

      <div className="bg-gradient-to-r from-cinema-gold/20 via-cinema-gold/10 to-cinema-gold/20 border border-cinema-gold/40 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🎬</div>
        <h3 className="text-xl font-display font-bold text-cinema-gold mb-2">Todo listo para generar tu estrategia</h3>
        <p className="text-cinema-text-dim text-sm mb-6 max-w-md mx-auto">
          Nuestro asesor de distribución con IA analizará tu película y redactará una estrategia personalizada: festivales seleccionados de nuestra base de datos, plan de marketing, ventanas de distribución y próximos pasos.
        </p>
        {isGenerating && (
          <p className="text-cinema-text-dim text-xs mb-4">Esto puede tardar hasta un minuto.</p>
        )}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-3 bg-gradient-gold text-cinema-black font-bold px-8 py-4 rounded-xl text-base hover:opacity-90 transition-all shadow-xl shadow-cinema-gold/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              El asesor IA está analizando tu película…
            </>
          ) : (
            <>
              <Target size={20} />
              Generar estrategia de distribución
            </>
          )}
        </button>
      </div>
    </div>
  );
}
