import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { FestivalRow, FestivalInput } from '../../lib/festivalsDb';

const TIERS = ['tier_a', 'tier_b', 'tier_c', 'nacional', 'regional'];
const TIER_LABELS: Record<string, string> = {
  tier_a: 'Tier A — Grandes internacionales',
  tier_b: 'Tier B — Especializados',
  tier_c: 'Tier C — Regionales',
  nacional: 'Nacional',
  regional: 'Regional',
};
const ALL_GENRES = [
  'drama','comedia','thriller','terror','ciencia_ficcion','animacion',
  'documental_social','documental_naturaleza','documental_historico',
  'romance','aventura','fantasia','experimental','musical','biopic','noir','western','otro',
];
const ALL_TYPES = ['cortometraje','mediometraje','largometraje','documental'];

interface Props {
  festival?: FestivalRow;
  onSave: (input: FestivalInput) => Promise<void>;
  onClose: () => void;
}

export function FestivalFormModal({ festival, onSave, onClose }: Props) {
  const isEdit = !!festival;

  const [form, setForm] = useState<FestivalInput>({
    name: festival?.name ?? '',
    country: festival?.country ?? '',
    city: festival?.city ?? '',
    tier: festival?.tier ?? 'tier_b',
    month: festival?.month ?? '',
    deadline: festival?.deadline ?? '',
    submission_fee: festival?.submission_fee ?? '',
    platform: festival?.platform ?? 'FilmFreeway',
    url: festival?.url ?? '',
    genres: festival?.genres ?? [],
    accepts_types: festival?.accepts_types ?? [],
    prestige: festival?.prestige ?? 70,
    reason: festival?.reason ?? '',
    active: festival?.active ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FestivalInput>(key: K, value: FestivalInput[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const toggleArray = (key: 'genres' | 'accepts_types', val: string) => {
    const arr = form[key] as string[];
    set(key, (arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]) as FestivalInput[typeof key]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('El nombre es obligatorio.');
    if (form.genres.length === 0) return setError('Selecciona al menos un género.');
    if (form.accepts_types.length === 0) return setError('Selecciona al menos un tipo de obra.');
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch {
      setError('Error al guardar. Inténtalo de nuevo.');
      setSaving(false);
    }
  };

  const inputClass = 'bg-cinema-dark border border-cinema-border rounded-lg px-3 py-2 text-cinema-text text-sm focus:outline-none focus:ring-2 focus:ring-cinema-gold/50 focus:border-cinema-gold transition-colors w-full';
  const labelClass = 'text-xs font-medium text-cinema-text-dim uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-cinema-card border border-cinema-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cinema-border sticky top-0 bg-cinema-card z-10">
          <h2 className="text-lg font-display font-bold text-cinema-text">
            {isEdit ? `Editar: ${festival.name}` : 'Añadir festival'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-cinema-text-dim hover:text-cinema-text hover:bg-cinema-dark transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          {/* Nombre y tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Nombre del festival *</label>
              <input className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Berlinale" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Tier *</label>
              <select className={inputClass} value={form.tier} onChange={e => set('tier', e.target.value)}>
                {TIERS.map(t => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
              </select>
            </div>
          </div>

          {/* País y ciudad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>País *</label>
              <input className={inputClass} value={form.country} onChange={e => set('country', e.target.value)} placeholder="Ej: Francia" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Ciudad *</label>
              <input className={inputClass} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Ej: Cannes" required />
            </div>
          </div>

          {/* Mes y deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Mes de celebración *</label>
              <input className={inputClass} value={form.month} onChange={e => set('month', e.target.value)} placeholder="Ej: Febrero" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Deadline de inscripción *</label>
              <input className={inputClass} value={form.deadline} onChange={e => set('deadline', e.target.value)} placeholder="Ej: Octubre-Noviembre" required />
            </div>
          </div>

          {/* Tasa y plataforma */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Tasa de inscripción</label>
              <input className={inputClass} value={form.submission_fee} onChange={e => set('submission_fee', e.target.value)} placeholder="Ej: 30-60€ o Gratuito" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Plataforma de envío</label>
              <input className={inputClass} value={form.platform} onChange={e => set('platform', e.target.value)} placeholder="Ej: FilmFreeway / Directo" />
            </div>
          </div>

          {/* URL y prestigio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>URL oficial *</label>
              <input className={inputClass} type="url" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://..." required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Prestigio (0-100): <span className="text-cinema-gold font-bold">{form.prestige}</span></label>
              <input type="range" min={0} max={100} value={form.prestige} onChange={e => set('prestige', parseInt(e.target.value))}
                className="w-full accent-cinema-gold mt-2" />
            </div>
          </div>

          {/* Géneros */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Géneros aceptados *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {ALL_GENRES.map(g => (
                <label key={g} className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => toggleArray('genres', g)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                      form.genres.includes(g) ? 'bg-cinema-gold border-cinema-gold' : 'border-cinema-border group-hover:border-cinema-gold/60'
                    }`}
                  >
                    {form.genres.includes(g) && (
                      <svg className="w-2.5 h-2.5 text-cinema-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span onClick={() => toggleArray('genres', g)} className="text-xs text-cinema-text-dim group-hover:text-cinema-text transition-colors">{g}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tipos de obra */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Tipos de obra aceptados *</label>
            <div className="flex flex-wrap gap-2">
              {ALL_TYPES.map(t => (
                <button key={t} type="button" onClick={() => toggleArray('accepts_types', t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    form.accepts_types.includes(t)
                      ? 'bg-cinema-gold text-cinema-black border-cinema-gold'
                      : 'border-cinema-border text-cinema-text-dim hover:border-cinema-gold/50'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Razón */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Razón de recomendación *</label>
            <textarea className={`${inputClass} resize-none`} rows={2} value={form.reason}
              onChange={e => set('reason', e.target.value)}
              placeholder="Por qué este festival es relevante para la estrategia..." required />
          </div>

          {/* Activo */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => set('active', !form.active)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${form.active ? 'bg-cinema-gold border-cinema-gold' : 'border-cinema-border'}`}>
              {form.active && <svg className="w-3 h-3 text-cinema-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-sm text-cinema-text" onClick={() => set('active', !form.active)}>Festival activo (visible en estrategias)</span>
          </label>

          {/* Acciones */}
          <div className="flex gap-3 pt-2 border-t border-cinema-border">
            <button type="submit" disabled={saving}
              className="flex-1 bg-gradient-gold text-cinema-black font-bold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all disabled:opacity-60">
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Añadir festival'}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 bg-cinema-dark border border-cinema-border text-cinema-text text-sm rounded-xl hover:border-cinema-gold/40 transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
