import type { DistributionGoals, FilmData } from '../../types/film';
import { SectionCard } from '../ui/SectionCard';
import { CheckboxGroup } from '../ui/CheckboxGroup';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';

interface Props {
  data: Partial<DistributionGoals>;
  onChange: (data: Partial<FilmData>) => void;
}

const DISTRIBUTION_TARGETS = [
  { value: 'festivales', label: '🏆 Circuito de festivales internacionales' },
  { value: 'salas_comerciales', label: '🎭 Salas de cine comerciales' },
  { value: 'vod_svod', label: '📱 Plataformas VOD / Streaming (Netflix, MUBI...)' },
  { value: 'television', label: '📺 Televisión (nacional e internacional)' },
  { value: 'educativo', label: '🎓 Distribución educativa (universidades, colegios)' },
  { value: 'online_gratuito', label: '🌐 Online gratuito (YouTube, Vimeo)' },
];

const GEOGRAPHIC_MARKETS = [
  { value: 'España', label: '🇪🇸 España' },
  { value: 'Latinoamérica', label: '🌎 Latinoamérica' },
  { value: 'Francia', label: '🇫🇷 Francia' },
  { value: 'Alemania', label: '🇩🇪 Alemania' },
  { value: 'Italia', label: '🇮🇹 Italia' },
  { value: 'Reino Unido', label: '🇬🇧 Reino Unido' },
  { value: 'EEUU y Canadá', label: '🇺🇸 EEUU y Canadá' },
  { value: 'Europa del Este', label: '🌍 Europa del Este' },
  { value: 'Asia', label: '🌏 Asia' },
  { value: 'Oriente Medio', label: '🌍 Oriente Medio y Norte de África' },
  { value: 'Iberoamérica completa', label: '🌐 Iberoamérica completa' },
  { value: 'Global', label: '🌍 Global (sin restricción territorial)' },
];

const PRIORITY_MARKETS = [
  { value: 'España', label: 'España' },
  { value: 'Latinoamérica', label: 'Latinoamérica' },
  { value: 'Francia', label: 'Francia' },
  { value: 'Alemania', label: 'Alemania' },
  { value: 'EEUU', label: 'Estados Unidos' },
  { value: 'Reino Unido', label: 'Reino Unido' },
  { value: 'Italia', label: 'Italia' },
  { value: 'Global', label: 'Global (sin restricción)' },
];

const RELEASE_WINDOWS = [
  { value: 'inmediato', label: 'Inmediato (menos de 3 meses)' },
  { value: '3_6_meses', label: 'En 3–6 meses' },
  { value: '6_12_meses', label: 'En 6–12 meses' },
  { value: '1_2_años', label: 'En 1–2 años (tras circuito de festivales)' },
  { value: 'sin_prisa', label: 'Sin urgencia / seguir el circuito de festivales' },
];

export function Step4Distribution({ data, onChange }: Props) {
  const update = (field: keyof DistributionGoals, value: string | string[] | boolean) => {
    onChange({ distributionGoals: { ...data, [field]: value } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-cinema-text mb-1">Objetivos de distribución</h2>
        <p className="text-cinema-text-dim text-sm">Define dónde y cómo quieres que tu película llegue al público.</p>
      </div>

      <SectionCard title="Canales de distribución objetivo">
        <CheckboxGroup
          label="¿Qué tipos de distribución te interesan?"
          hint="Puedes seleccionar varios. La estrategia se adaptará a tus objetivos."
          options={DISTRIBUTION_TARGETS}
          selected={data.primaryTargets ?? []}
          onChange={values => update('primaryTargets', values)}
          columns={1}
        />
      </SectionCard>

      <SectionCard title="Mercados geográficos">
        <div className="space-y-4">
          <CheckboxGroup
            label="Territorios de interés"
            hint="¿En qué mercados quieres distribuir tu película?"
            options={GEOGRAPHIC_MARKETS}
            selected={data.geographicMarkets ?? []}
            onChange={values => update('geographicMarkets', values)}
            columns={2}
          />
          <Select
            label="Mercado prioritario principal"
            options={PRIORITY_MARKETS}
            value={data.priorityMarket ?? ''}
            onChange={e => update('priorityMarket', e.target.value)}
            placeholder="¿Dónde más quieres impactar?"
          />
        </div>
      </SectionCard>

      <SectionCard title="Estrategia de lanzamiento">
        <div className="space-y-4">
          <Select
            label="¿Cuándo esperas hacer el lanzamiento principal?"
            options={RELEASE_WINDOWS}
            value={data.expectedReleaseWindow ?? ''}
            onChange={e => update('expectedReleaseWindow', e.target.value)}
            placeholder="Selecciona un horizonte temporal"
          />
          <Input
            label="Versiones lingüísticas que necesitas"
            placeholder="Ej: subtítulos en inglés y francés, doblaje al inglés..."
            value={data.languageVersionsNeeded ?? ''}
            onChange={e => update('languageVersionsNeeded', e.target.value)}
          />
        </div>
        <div className="mt-4 space-y-3">
          {([
            { key: 'openToInternationalSales' as keyof DistributionGoals, label: 'Estoy interesado/a en ventas internacionales de derechos a distribuidoras extranjeras' },
            { key: 'wantsTheatrical' as keyof DistributionGoals, label: 'Quiero explorar el estreno en salas de cine' },
            { key: 'wantsStreaming' as keyof DistributionGoals, label: 'Quiero distribución en plataformas de streaming (SVOD/AVOD)' },
            { key: 'wantsTV' as keyof DistributionGoals, label: 'Quiero vender derechos de televisión' },
            { key: 'wantsEducational' as keyof DistributionGoals, label: 'Me interesa la distribución educativa e institucional' },
          ]).map(item => (
            <label key={String(item.key)} className="flex items-center gap-3 cursor-pointer group py-2 border-b border-cinema-border last:border-0">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${data[item.key] ? 'bg-cinema-gold border-cinema-gold' : 'border-cinema-border group-hover:border-cinema-gold/60'}`}
                onClick={() => update(item.key, !data[item.key])}
              >
                {data[item.key] && (
                  <svg className="w-3 h-3 text-cinema-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-cinema-text" onClick={() => update(item.key, !data[item.key])}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
