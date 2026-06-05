import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, AlertCircle, RefreshCw, EyeOff } from 'lucide-react';
import {
  listAllFestivalsAdmin, createFestival, updateFestival, deleteFestival,
  type FestivalRow, type FestivalInput,
} from '../../lib/festivalsDb';
import { FestivalFormModal } from './FestivalFormModal';

const TIER_LABELS: Record<string, string> = {
  tier_a: 'Tier A', tier_b: 'Tier B', tier_c: 'Tier C', nacional: 'Nacional', regional: 'Regional',
};
const TIER_COLORS: Record<string, string> = {
  tier_a: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  tier_b: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  tier_c: 'text-cinema-text-dim bg-cinema-dark border-cinema-border',
  nacional: 'text-green-400 bg-green-400/10 border-green-400/30',
  regional: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
};

interface Props {
  onBack: () => void;
}

export function FestivalsAdmin({ onBack }: Props) {
  const [festivals, setFestivals] = useState<FestivalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingFestival, setEditingFestival] = useState<FestivalRow | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      setFestivals(await listAllFestivalsAdmin());
    } catch {
      setError('Error al cargar festivales. Comprueba tu conexión.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(input: FestivalInput) {
    if (editingFestival) {
      const updated = await updateFestival(editingFestival.id, input);
      setFestivals(prev => prev.map(f => f.id === updated.id ? updated : f));
    } else {
      const created = await createFestival(input);
      setFestivals(prev => [created, ...prev]);
    }
  }

  async function handleDelete(festival: FestivalRow) {
    if (!confirm(`¿Eliminar "${festival.name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(festival.id);
    try {
      await deleteFestival(festival.id);
      setFestivals(prev => prev.filter(f => f.id !== festival.id));
    } catch {
      alert('Error al eliminar. Inténtalo de nuevo.');
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = festivals.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.country.toLowerCase().includes(search.toLowerCase()) ||
    f.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={onBack} className="text-cinema-text-dim hover:text-cinema-gold text-sm transition-colors">
              ← Mis estrategias
            </button>
            <span className="text-cinema-border">/</span>
            <span className="text-cinema-text text-sm font-semibold">Panel de administración</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-cinema-text">Gestión de festivales</h2>
          <p className="text-cinema-text-dim text-sm mt-0.5">
            {festivals.length} festivales · {festivals.filter(f => f.active).length} activos
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} title="Recargar"
            className="p-2.5 rounded-lg border border-cinema-border text-cinema-text-dim hover:text-cinema-gold hover:border-cinema-gold/40 transition-all">
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => { setEditingFestival(undefined); setShowForm(true); }}
            className="flex items-center gap-2 bg-gradient-gold text-cinema-black font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-all">
            <Plus size={15} />
            Añadir festival
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cinema-text-dim" />
        <input
          type="text"
          placeholder="Buscar por nombre, país o ciudad..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-cinema-card border border-cinema-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-cinema-text placeholder-cinema-muted focus:outline-none focus:ring-2 focus:ring-cinema-gold/50 focus:border-cinema-gold transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5 text-red-400 text-sm">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin w-7 h-7 text-cinema-gold" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <div className="bg-cinema-card border border-cinema-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-cinema-border bg-cinema-dark">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-cinema-text-dim uppercase tracking-wide">Festival</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-cinema-text-dim uppercase tracking-wide hidden sm:table-cell">País</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-cinema-text-dim uppercase tracking-wide">Tier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-cinema-text-dim uppercase tracking-wide hidden md:table-cell">Mes</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-cinema-text-dim uppercase tracking-wide hidden md:table-cell">Deadline</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-cinema-text-dim uppercase tracking-wide">Prest.</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-border">
              {filtered.map(f => (
                <tr key={f.id} className={`hover:bg-cinema-dark/50 transition-colors ${!f.active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!f.active && <EyeOff size={12} className="text-cinema-text-dim shrink-0" />}
                      <span className="font-medium text-cinema-text">{f.name}</span>
                    </div>
                    <span className="text-xs text-cinema-text-dim">{f.city}</span>
                  </td>
                  <td className="px-4 py-3 text-cinema-text-dim hidden sm:table-cell">{f.country}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${TIER_COLORS[f.tier] ?? ''}`}>
                      {TIER_LABELS[f.tier] ?? f.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-cinema-text-dim hidden md:table-cell">{f.month}</td>
                  <td className="px-4 py-3 text-cinema-text-dim hidden md:table-cell">{f.deadline}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-cinema-gold font-bold text-sm">{f.prestige}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => { setEditingFestival(f); setShowForm(true); }}
                        className="p-1.5 rounded-lg text-cinema-text-dim hover:text-cinema-gold hover:bg-cinema-gold/10 transition-all"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(f)}
                        disabled={deletingId === f.id}
                        className="p-1.5 rounded-lg text-cinema-text-dim hover:text-red-400 hover:bg-red-400/10 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-cinema-text-dim text-sm">
                    {search ? `Sin resultados para "${search}"` : 'No hay festivales aún.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <FestivalFormModal
          festival={editingFestival}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingFestival(undefined); }}
        />
      )}
    </div>
  );
}
