import { useState, useEffect } from 'react';
import { AlertCircle, ExternalLink, Plus, X, Check, RotateCcw } from 'lucide-react';
import { listSuggestions, setSuggestionStatus, type SuggestionRow, type SuggestionStatus } from '../../lib/suggestions';
import { createFestival, type FestivalInput, type FestivalRow } from '../../lib/festivalsDb';
import { genreLabel } from '../../utils/format';
import { FestivalFormModal } from './FestivalFormModal';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// «29 de abril al 9 de mayo de 2027» → «Abril-Mayo»
function monthsFrom(dates: string): string {
  const lower = dates.toLowerCase();
  const found = MONTHS
    .map(m => ({ m, at: lower.indexOf(m) }))
    .filter(x => x.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map(x => x.m.charAt(0).toUpperCase() + x.m.slice(1));
  const unique = [...new Set(found)];
  return unique.length > 1 ? `${unique[0]}-${unique[unique.length - 1]}` : unique[0] ?? '';
}

function toFestivalInput(s: SuggestionRow): Partial<FestivalInput> {
  return {
    name: s.name,
    country: s.country === 'Por confirmar' ? '' : s.country,
    city: s.city === 'Por confirmar' ? '' : s.city,
    tier: s.country.toLowerCase() === 'españa' ? 'nacional' : 'tier_c',
    month: monthsFrom(s.dates),
    deadline: s.deadline,
    submission_fee: s.submission_fee === 'Por confirmar' ? '' : s.submission_fee,
    platform: /filmfreeway/i.test(s.url) ? 'FilmFreeway' : 'Directo',
    url: s.url,
    genres: s.film_genres,
    accepts_types: s.film_types,
    prestige: 60,
    reason: s.notes.replace(/^Sugerencia externa pendiente de verificar\.\s*/i, ''),
    active: true,
  };
}

const STATUS_LABEL: Record<SuggestionStatus, string> = {
  pendiente: 'Pendiente',
  añadida: 'Añadida',
  descartada: 'Descartada',
};

interface Props {
  onFestivalCreated: (festival: FestivalRow) => void;
  onPendingCount: (count: number) => void;
}

export function SuggestionsAdmin({ onFestivalCreated, onPendingCount }: Props) {
  const [items, setItems] = useState<SuggestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pendiente' | 'todas'>('pendiente');
  const [adding, setAdding] = useState<SuggestionRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);
  useEffect(() => { onPendingCount(items.filter(i => i.status === 'pendiente').length); }, [items, onPendingCount]);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      setItems(await listSuggestions());
    } catch {
      setError('No se pudieron cargar las sugerencias. Comprueba que la migración 007 está aplicada en Supabase.');
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(item: SuggestionRow, status: SuggestionStatus) {
    setBusyId(item.id);
    try {
      await setSuggestionStatus(item.id, status);
      setItems(prev => prev.map(i => (i.id === item.id ? { ...i, status } : i)));
    } catch {
      alert('No se pudo actualizar la sugerencia. Inténtalo de nuevo.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleAdd(input: FestivalInput) {
    if (!adding) return;
    const created = await createFestival(input);
    onFestivalCreated(created);
    await changeStatus(adding, 'añadida');
  }

  const visible = filter === 'pendiente' ? items.filter(i => i.status === 'pendiente') : items;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-cinema-text-dim text-sm max-w-xl">
          Oportunidades que el asesor IA ha encontrado en la web al analizar películas y que no están en la base de datos.
          Revisa la fuente antes de añadirlas.
        </p>
        <div className="flex rounded-lg border border-cinema-border overflow-hidden text-xs">
          {(['pendiente', 'todas'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 transition-colors ${filter === f ? 'bg-cinema-gold text-cinema-black font-semibold' : 'text-cinema-text-dim hover:text-cinema-text'}`}>
              {f === 'pendiente' ? 'Pendientes' : 'Todas'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5 text-red-400 text-sm">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-center text-cinema-text-dim text-sm py-16">Cargando sugerencias…</p>
      ) : visible.length === 0 && !error ? (
        <p className="text-center text-cinema-text-dim text-sm py-16 bg-cinema-card border border-cinema-border rounded-xl">
          {filter === 'pendiente'
            ? 'No hay sugerencias pendientes. Aparecerán aquí cuando el asesor IA encuentre oportunidades nuevas.'
            : 'Todavía no hay sugerencias.'}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map(s => (
            <div key={s.id} className={`bg-cinema-card border border-cinema-border rounded-xl p-4 ${s.status !== 'pendiente' ? 'opacity-60' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide border border-cinema-border rounded-full px-2 py-0.5 text-cinema-text-dim">
                      {s.kind === 'festival' ? 'Festival / mercado' : 'Plataforma / TV'}
                    </span>
                    {s.times_suggested > 1 && (
                      <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-cinema-gold/15 text-cinema-gold">
                        Sugerida {s.times_suggested} veces
                      </span>
                    )}
                    {s.status !== 'pendiente' && (
                      <span className="text-[10px] text-cinema-text-dim">{STATUS_LABEL[s.status]}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-cinema-text">{s.name}</h3>
                  <p className="text-xs text-cinema-text-dim mt-0.5">
                    {s.kind === 'festival'
                      ? [s.country, s.city, s.dates].filter(Boolean).join(' · ')
                      : [s.platform_type, s.territory].filter(Boolean).join(' · ')}
                  </p>
                  {s.kind === 'festival' && (s.deadline || s.submission_fee) && (
                    <p className="text-xs text-cinema-gold mt-1">
                      {s.deadline && <>Plazo: {s.deadline}</>}
                      {s.deadline && s.submission_fee && ' · '}
                      {s.submission_fee && <>Tasa: {s.submission_fee}</>}
                    </p>
                  )}
                  {s.notes && <p className="text-sm text-cinema-text-dim mt-2">{s.notes}</p>}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cinema-gold hover:underline break-all">
                      <ExternalLink size={11} className="shrink-0" /> Ver fuente
                    </a>
                    {s.film_genres.length > 0 && (
                      <span className="text-cinema-text-dim">
                        Para: {[...s.film_types, ...s.film_genres.map(genreLabel)].join(', ')}
                      </span>
                    )}
                    <span className="text-cinema-text-dim">
                      Última vez: {new Date(s.last_suggested_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {s.status === 'pendiente' ? (
                    <>
                      {s.kind === 'festival' ? (
                        <button onClick={() => setAdding(s)} disabled={busyId === s.id}
                          className="inline-flex items-center gap-1.5 bg-gradient-gold text-cinema-black font-semibold px-3 py-1.5 rounded-lg text-xs hover:opacity-90 transition-all disabled:opacity-60">
                          <Plus size={13} /> Añadir a la base
                        </button>
                      ) : (
                        <button onClick={() => changeStatus(s, 'añadida')} disabled={busyId === s.id}
                          title="Las plataformas se añaden al catálogo en el código; márcala cuando esté incorporada"
                          className="inline-flex items-center gap-1.5 border border-cinema-gold/50 text-cinema-gold font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-cinema-gold/10 transition-all disabled:opacity-60">
                          <Check size={13} /> Marcar añadida
                        </button>
                      )}
                      <button onClick={() => changeStatus(s, 'descartada')} disabled={busyId === s.id}
                        className="inline-flex items-center gap-1.5 border border-cinema-border text-cinema-text-dim px-3 py-1.5 rounded-lg text-xs hover:text-red-400 hover:border-red-400/40 transition-all disabled:opacity-60">
                        <X size={13} /> Descartar
                      </button>
                    </>
                  ) : (
                    <button onClick={() => changeStatus(s, 'pendiente')} disabled={busyId === s.id}
                      className="inline-flex items-center gap-1.5 border border-cinema-border text-cinema-text-dim px-3 py-1.5 rounded-lg text-xs hover:text-cinema-text transition-all disabled:opacity-60">
                      <RotateCcw size={12} /> Volver a pendiente
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <FestivalFormModal
          initial={toFestivalInput(adding)}
          onSave={handleAdd}
          onClose={() => setAdding(null)}
        />
      )}
    </div>
  );
}
