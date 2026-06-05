import { useState, useEffect } from 'react';
import { Film, Plus, Trash2, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { listStrategies, deleteStrategy, type SavedStrategy } from '../../lib/strategies';
import { Button } from '../ui/Button';

interface DashboardProps {
  onNew: () => void;
  onLoad: (strategy: SavedStrategy) => void;
}

export function Dashboard({ onNew, onLoad }: DashboardProps) {
  const [strategies, setStrategies] = useState<SavedStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await listStrategies();
      setStrategies(data);
    } catch {
      setError('No se pudieron cargar las estrategias. Comprueba tu conexión.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta estrategia? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    try {
      await deleteStrategy(id);
      setStrategies(prev => prev.filter(s => s.id !== id));
    } catch {
      alert('Error al eliminar. Inténtalo de nuevo.');
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-cinema-text">Mis estrategias</h2>
          <p className="text-cinema-text-dim text-sm mt-1">
            {strategies.length === 0 && !loading
              ? 'Aún no tienes estrategias guardadas.'
              : `${strategies.length} estrategia${strategies.length !== 1 ? 's' : ''} guardada${strategies.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button variant="primary" onClick={onNew}>
          <Plus size={16} />
          Nueva estrategia
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin w-7 h-7 text-cinema-gold" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : strategies.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-cinema-border rounded-2xl">
          <Film size={40} className="text-cinema-text-dim mx-auto mb-4 opacity-40" />
          <p className="text-cinema-text-dim text-sm mb-6">
            Crea tu primera estrategia de distribución
          </p>
          <Button variant="primary" onClick={onNew}>
            <Plus size={16} />
            Comenzar ahora
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {strategies.map(s => (
            <li
              key={s.id}
              onClick={() => onLoad(s)}
              className="group flex items-center justify-between bg-cinema-card border border-cinema-border rounded-xl px-5 py-4 cursor-pointer hover:border-cinema-gold/40 hover:bg-cinema-card/80 transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-cinema-gold/10 flex items-center justify-center shrink-0">
                  <Film size={18} className="text-cinema-gold" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-cinema-text truncate">{s.film_title}</p>
                  <div className="flex items-center gap-1 text-cinema-text-dim text-xs mt-0.5">
                    <Clock size={11} />
                    <span>Actualizada el {formatDate(s.updated_at)}</span>
                    {s.report && (
                      <span className="ml-2 bg-cinema-gold/15 text-cinema-gold rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                        Con informe
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={e => handleDelete(s.id, e)}
                  disabled={deletingId === s.id}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-cinema-text-dim hover:text-red-400 hover:bg-red-400/10 transition-all"
                  title="Eliminar"
                >
                  <Trash2 size={15} />
                </button>
                <ChevronRight size={16} className="text-cinema-text-dim group-hover:text-cinema-gold transition-colors" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
