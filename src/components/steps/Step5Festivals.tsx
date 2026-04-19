import type { FestivalStrategy, FilmData } from '../../types/film';
import { SectionCard } from '../ui/SectionCard';
import { CheckboxGroup } from '../ui/CheckboxGroup';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Info, Trophy } from 'lucide-react';

interface Props {
  data: Partial<FestivalStrategy>;
  onChange: (data: Partial<FilmData>) => void;
}

const FESTIVAL_TIERS = [
  { value: 'tier_a', label: '⭐ Tier A — Grandes festivales (Cannes, Berlinale, Venecia, Sundance)' },
  { value: 'tier_b', label: '🥈 Tier B — Festivales especializados (Clermont-Ferrand, IDFA, San Sebastián)' },
  { value: 'tier_c', label: '🥉 Tier C — Festivales regionales y temáticos' },
  { value: 'nacional', label: '🇪🇸 Festivales nacionales españoles (Goya, Málaga, Seminci...)' },
  { value: 'regional', label: '📍 Festivales regionales / locales' },
];

const GEO_FOCUS_OPTIONS = [
  { value: 'España', label: '🇪🇸 España' },
  { value: 'Europa Occidental', label: '🌍 Europa Occidental' },
  { value: 'Europa del Este', label: '🌍 Europa del Este' },
  { value: 'Latinoamérica', label: '🌎 Latinoamérica' },
  { value: 'EEUU', label: '🇺🇸 EEUU y Canadá' },
  { value: 'Asia', label: '🌏 Asia' },
  { value: 'Oriente Medio', label: '🌍 Oriente Medio' },
  { value: 'Global', label: '🌐 Global (sin restricción)' },
];

const SUBMISSION_STRATEGIES = [
  { value: 'exclusiva', label: 'Exclusiva — Solo un festival a la vez hasta respuesta' },
  { value: 'selectiva', label: 'Selectiva — Pocos festivales muy bien elegidos' },
  { value: 'amplia', label: 'Amplia — Enviar al máximo número posible' },
];

const PREMIERE_STATUS = [
  { value: 'sin_premiere', label: 'Sin estreno previo — disponible para estreno mundial' },
  { value: 'online_festival', label: 'Solo proyectada en plataforma online de festival' },
  { value: 'premiere_regional', label: 'Estreno regional (comunidad, ciudad)' },
  { value: 'premiere_nacional', label: 'Estreno nacional (en España)' },
  { value: 'premiere_europea', label: 'Estreno europeo (ya en Europa)' },
  { value: 'premiere_internacional', label: 'Estreno internacional realizado' },
];

export function Step5Festivals({ data, onChange }: Props) {
  const update = (field: keyof FestivalStrategy, value: string | string[] | boolean | number) => {
    onChange({ festivalStrategy: { ...data, [field]: value } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-cinema-text mb-1">Estrategia de festivales</h2>
        <p className="text-cinema-text-dim text-sm">Los festivales son el primer escalón de la distribución y la mejor herramienta de validación.</p>
      </div>

      <div className="flex items-start gap-3 bg-cinema-gold/10 border border-cinema-gold/30 rounded-xl p-4">
        <Trophy size={18} className="text-cinema-gold mt-0.5 flex-shrink-0" />
        <div className="text-sm text-cinema-text-dim space-y-1">
          <p><strong className="text-cinema-gold">¿Por qué los festivales primero?</strong></p>
          <p>Los festivales generan visibilidad, premios y contactos con distribuidores. Una selección en Cannes, Sundance o Clermont-Ferrand puede transformar completamente las opciones de distribución de tu película.</p>
        </div>
      </div>

      <SectionCard title="Estado del estreno mundial">
        <div className="space-y-4">
          <Select
            label="Estado actual de las proyecciones"
            options={PREMIERE_STATUS}
            value={data.currentPremiereStatus ?? ''}
            onChange={e => update('currentPremiereStatus', e.target.value)}
            placeholder="Selecciona el estado actual"
            required
          />
          <label className="flex items-center gap-3 cursor-pointer group py-2">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${data.worldPremiereAvailable ? 'bg-cinema-gold border-cinema-gold' : 'border-cinema-border group-hover:border-cinema-gold/60'}`}
              onClick={() => update('worldPremiereAvailable', !data.worldPremiereAvailable)}
            >
              {data.worldPremiereAvailable && (
                <svg className="w-3 h-3 text-cinema-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div onClick={() => update('worldPremiereAvailable', !data.worldPremiereAvailable)}>
              <span className="text-sm text-cinema-text font-medium">La película está disponible para estreno mundial</span>
              <p className="text-xs text-cinema-text-dim mt-0.5">El estreno mundial es un activo muy valioso para festivales Tier A. Si está disponible, abre muchas más puertas.</p>
            </div>
          </label>

          <div className="flex items-start gap-2 bg-cinema-blue/10 border border-cinema-blue-light/20 rounded-lg p-3">
            <Info size={14} className="text-cinema-blue-light mt-0.5 flex-shrink-0" />
            <p className="text-xs text-cinema-text-dim">
              <strong>Importante:</strong> Festivales como Cannes, Berlinale y Sundance exigen estreno mundial o europeo. Una vez proyectada públicamente fuera de un festival, la película pierde este estatus. No publiques en YouTube ni redes antes de completar el circuito de festivales.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Perfil de festivales objetivo">
        <div className="space-y-5">
          <CheckboxGroup
            label="¿A qué tier de festivales quieres acceder?"
            hint="Puedes apuntar a varios niveles. La estrategia combinará los diferentes tiers."
            options={FESTIVAL_TIERS}
            selected={data.targetTiers ?? []}
            onChange={values => update('targetTiers', values)}
            columns={1}
          />
          <CheckboxGroup
            label="Enfoque geográfico de festivales"
            hint="¿En qué regiones del mundo quieres participar?"
            options={GEO_FOCUS_OPTIONS}
            selected={data.geographicFocus ?? []}
            onChange={values => update('geographicFocus', values)}
            columns={2}
          />
          <Select
            label="Estrategia de envío"
            options={SUBMISSION_STRATEGIES}
            value={data.submissionStrategy ?? ''}
            onChange={e => update('submissionStrategy', e.target.value as FestivalStrategy['submissionStrategy'])}
            placeholder="Selecciona tu estrategia"
          />
        </div>
      </SectionCard>

      <SectionCard title="Planificación y presupuesto de festivales">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Presupuesto total para inscripciones (€)"
            type="number"
            min={0}
            placeholder="1500"
            value={data.submissionBudget ?? ''}
            onChange={e => update('submissionBudget', parseInt(e.target.value) || 0)}
            hint="Suma de todas las tasas de inscripción estimadas"
          />
          <Input
            label="Número de festivales objetivo"
            type="number"
            min={1}
            max={100}
            placeholder="20"
            value={data.targetFestivalCount ?? ''}
            onChange={e => update('targetFestivalCount', parseInt(e.target.value) || 0)}
            hint="¿A cuántos festivales planeas enviar?"
          />
          <Input
            label="Fecha de inicio de la campaña"
            type="date"
            value={data.startDate ?? ''}
            onChange={e => update('startDate', e.target.value)}
            className="sm:col-span-1"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer group mt-4 py-2">
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${data.hasFilmFreewayAccount ? 'bg-cinema-gold border-cinema-gold' : 'border-cinema-border group-hover:border-cinema-gold/60'}`}
            onClick={() => update('hasFilmFreewayAccount', !data.hasFilmFreewayAccount)}
          >
            {data.hasFilmFreewayAccount && (
              <svg className="w-3 h-3 text-cinema-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm text-cinema-text" onClick={() => update('hasFilmFreewayAccount', !data.hasFilmFreewayAccount)}>
            Ya tengo cuenta en FilmFreeway (la principal plataforma de inscripción en festivales)
          </span>
        </label>
      </SectionCard>

      <SectionCard title="Preferencias específicas">
        <div className="space-y-4">
          <Textarea
            label="Festivales prioritarios (los que más te interesan)"
            hint="Lista los festivales donde más quisieras ser seleccionado/a"
            placeholder="1. Clermont-Ferrand&#10;2. San Sebastián&#10;3. Málaga..."
            value={data.priorityFestivals?.join('\n') ?? ''}
            onChange={e => update('priorityFestivals', e.target.value.split('\n').filter(Boolean))}
            rows={4}
          />
          <Textarea
            label="Festivales a evitar o condiciones especiales"
            hint="Si hay algún festival con el que no quieres competir o tiene condiciones especiales"
            placeholder="Evitar festivales que exijan exclusividad, o que tengan conflicto de fechas con..."
            value={data.avoidedFestivals ?? ''}
            onChange={e => update('avoidedFestivals', e.target.value)}
            rows={2}
          />
        </div>
      </SectionCard>
    </div>
  );
}
