import type { BudgetResources, FilmData } from '../../types/film';
import { SectionCard } from '../ui/SectionCard';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { TrendingUp } from 'lucide-react';

interface Props {
  data: Partial<BudgetResources>;
  onChange: (data: Partial<FilmData>) => void;
}

const TEAM_SIZES = [
  { value: 'solo', label: 'Solo/a — Sin equipo de distribución' },
  { value: 'pequeno', label: 'Pequeño — 2–3 personas (director/a + productor/a)' },
  { value: 'mediano', label: 'Mediano — 4–6 personas con equipo de marketing' },
  { value: 'grande', label: 'Grande — Equipo profesional de distribución' },
];

const TIMELINES = [
  { value: 'urgente', label: 'Urgente — Quiero lanzar en menos de 3 meses' },
  { value: 'rapido', label: 'Rápido — 3 a 6 meses' },
  { value: 'estandar', label: 'Estándar — 6 a 12 meses' },
  { value: 'calma', label: 'Con calma — 12 a 24 meses (circuito completo de festivales)' },
  { value: 'sin_prisa', label: 'Sin prisas — La película seguirá su propio ritmo' },
];

const HOURS_OPTIONS = [
  { value: '2', label: '2 horas/semana (muy limitado)' },
  { value: '5', label: '5 horas/semana' },
  { value: '10', label: '10 horas/semana' },
  { value: '20', label: '20 horas/semana (media jornada)' },
  { value: '40', label: '40 horas/semana (jornada completa)' },
];

export function Step6Budget({ data, onChange }: Props) {
  const update = (field: keyof BudgetResources, value: string | number | boolean) => {
    onChange({ budgetResources: { ...data, [field]: value } });
  };

  const total = data.totalDistributionBudget ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-cinema-text mb-1">Presupuesto y recursos</h2>
        <p className="text-cinema-text-dim text-sm">El presupuesto disponible determina el alcance de la estrategia. Sé realista — también con poco se puede hacer mucho.</p>
      </div>

      <div className="flex items-start gap-3 bg-cinema-gold/10 border border-cinema-gold/30 rounded-xl p-4">
        <TrendingUp size={18} className="text-cinema-gold mt-0.5 flex-shrink-0" />
        <div className="text-sm text-cinema-text-dim">
          <p><strong className="text-cinema-gold">Presupuesto de distribución ≠ presupuesto de producción.</strong></p>
          <p className="mt-1">El coste de distribución suele ser el 10–30% del presupuesto de producción. Para un cortometraje, un presupuesto de 1.500–5.000€ puede dar resultados excelentes si se invierte bien.</p>
        </div>
      </div>

      <SectionCard title="Presupuesto total de distribución">
        <div className="space-y-4">
          <Input
            label="Presupuesto total disponible para distribución (€)"
            type="number"
            min={0}
            placeholder="5000"
            value={data.totalDistributionBudget ?? ''}
            onChange={e => update('totalDistributionBudget', parseInt(e.target.value) || 0)}
            hint="Incluye todo: inscripciones, materiales, marketing, viajes, publicista..."
            required
          />
          {total > 0 && (
            <div className="bg-cinema-dark rounded-lg p-4">
              <p className="text-xs text-cinema-text-dim mb-3">Distribución sugerida con {total.toLocaleString('es-ES')}€:</p>
              <div className="space-y-2">
                {[
                  { label: 'Inscripciones festivales', pct: 25 },
                  { label: 'Materiales (DCP, tráiler, póster)', pct: 20 },
                  { label: 'Marketing digital', pct: 20 },
                  { label: 'Viajes y asistencia', pct: 15 },
                  { label: 'Prensa y publicista', pct: 10 },
                  { label: 'Subtítulos y traducciones', pct: 5 },
                  { label: 'Reserva / imprevistos', pct: 5 },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-cinema-text-dim w-44 flex-shrink-0">{item.label}</span>
                    <div className="flex-1 bg-cinema-border rounded-full h-1.5">
                      <div className="bg-cinema-gold rounded-full h-1.5" style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="text-xs text-cinema-gold font-medium w-20 text-right">
                      {Math.round(total * item.pct / 100).toLocaleString('es-ES')}€ ({item.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Desglose del presupuesto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Presupuesto para festivales (inscripciones) (€)"
            type="number"
            min={0}
            placeholder="1500"
            value={data.festivalsBudget ?? ''}
            onChange={e => update('festivalsBudget', parseInt(e.target.value) || 0)}
          />
          <Input
            label="Presupuesto de marketing y publicidad (€)"
            type="number"
            min={0}
            placeholder="1000"
            value={data.marketingBudget ?? ''}
            onChange={e => update('marketingBudget', parseInt(e.target.value) || 0)}
          />
          <Input
            label="Presupuesto para PR / publicista (€)"
            type="number"
            min={0}
            placeholder="500"
            value={data.prBudget ?? ''}
            onChange={e => update('prBudget', parseInt(e.target.value) || 0)}
          />
          <Input
            label="Presupuesto para subtítulos / traducción (€)"
            type="number"
            min={0}
            placeholder="300"
            value={data.translationBudget ?? ''}
            onChange={e => update('translationBudget', parseInt(e.target.value) || 0)}
          />
          <Input
            label="Presupuesto para materiales técnicos (DCP, etc.) (€)"
            type="number"
            min={0}
            placeholder="800"
            value={data.deliverablesBudget ?? ''}
            onChange={e => update('deliverablesBudget', parseInt(e.target.value) || 0)}
          />
        </div>
      </SectionCard>

      <SectionCard title="Equipo y recursos humanos">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Tamaño del equipo de distribución"
            options={TEAM_SIZES}
            value={data.teamSize ?? ''}
            onChange={e => update('teamSize', e.target.value)}
            placeholder="Selecciona"
          />
          <Select
            label="Horas semanales dedicadas a distribución"
            options={HOURS_OPTIONS}
            value={String(data.dedicatedHoursPerWeek ?? '')}
            onChange={e => update('dedicatedHoursPerWeek', parseInt(e.target.value) || 0)}
            placeholder="Selecciona"
          />
          <Select
            label="Horizonte temporal de la campaña"
            options={TIMELINES}
            value={data.launchTimeline ?? ''}
            onChange={e => update('launchTimeline', e.target.value)}
            placeholder="Selecciona"
            className="sm:col-span-2"
          />
        </div>

        <div className="mt-4 space-y-3">
          {([
            { key: 'hasPublicist' as keyof BudgetResources, label: 'Tengo / voy a contratar un/a publicista especializado/a en cine' },
            { key: 'hasSalesAgent' as keyof BudgetResources, label: 'Tengo un/a agente de ventas internacional (sales agent)' },
            { key: 'hasDistributor' as keyof BudgetResources, label: 'Ya tengo un acuerdo con una distribuidora' },
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

      <SectionCard title="Notas adicionales">
        <Textarea
          label="Contexto adicional o condiciones especiales"
          hint="Cualquier información relevante que deba tenerse en cuenta en la estrategia"
          placeholder="Ej: La película está cofinanciada por el ICAA y tiene obligaciones de distribución en España, tenemos un acuerdo previo con una cadena de televisión, existe un conflicto con un productor que limita ciertos territorios..."
          value={data.additionalNotes ?? ''}
          onChange={e => update('additionalNotes', e.target.value)}
          rows={4}
        />
      </SectionCard>
    </div>
  );
}
