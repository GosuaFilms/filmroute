import { useState, useEffect } from 'react';
import { Film, Plus, Trash2, Clock, FileText, Pencil, AlertCircle, Trophy, Star } from 'lucide-react';
import { listStrategies, deleteStrategy, type SavedStrategy } from '../../lib/strategies';
import { Button } from '../ui/Button';

interface DashboardProps {
  onNew: () => void;
  onLoad: (strategy: SavedStrategy, mode: 'report' | 'wizard') => void;
}

const FILM_TYPE_LABELS: Record<string, string> = {
  cortometraje: 'Cortometraje',
  mediometraje: 'Mediometraje',
  largometraje: 'Largometraje',
  documental: 'Documental',
};

const GENRE_LABELS: Record<string, string> = {
  drama: 'Drama',
  comedia: 'Comedia',
  thriller: 'Thriller',
  terror: 'Terror',
  ciencia_ficcion: 'Ciencia Ficción',
  animacion: 'Animación',
  documental_social: 'Doc. Social',
  documental_naturaleza: 'Doc. Naturaleza',
  documental_historico: 'Doc. Histórico',
  romance: 'Romance',
  aventura: 'Aventura',
  fantasia: 'Fantasía',
  experimental: 'Experimental',
  musical: 'Musical',
  biopic: 'Biopic',
  noir: 'Noir',
  western: 'Western',
  otro: 'Otro',
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? 'text-green-400 bg-green-400/10 border-green-400/30' :
    score >= 50 ? 'text-cinema-gold bg-cinema-gold/10 border-cinema-gold/30' :
    'text-orange-400 bg-orange-400/10 border-orange-400/30';
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full px-2 py-0.5 text-[11px] font-bold ${color}`}>
      <Star size={10} />
      {score}/100
    </span>
  );
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

  const withReport = strategies.filter(s => s.report);
  const withoutReport = strategies.filter(s => !s.report);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-cinema-text">Mis estrategias</h2>
          <p className="text-cinema-text-dim text-sm mt-1">
            {loading ? 'Cargando...' :
              strategies.length === 0 ? 'Aún no tienes estrategias guardadas.' :
              `${strategies.length} estrategia${strategies.length !== 1 ? 's' : ''} guardada${strategies.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button variant="primary" onClick={onNew}>
          <Plus size={16} />
          Nueva estrategia
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Spinner */}
      {loading && (
        <div className="flex justify-center py-20">
          <svg className="animate-spin w-7 h-7 text-cinema-gold" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* Estado vacío */}
      {!loading && strategies.length === 0 && (
        <div className="text-center py-20 border border-dashed border-cinema-border rounded-2xl">
          <Film size={40} className="text-cinema-text-dim mx-auto mb-4 opacity-40" />
          <p className="text-cinema-text text-base font-semibold mb-2">Sin estrategias todavía</p>
          <p className="text-cinema-text-dim text-sm mb-6 max-w-xs mx-auto">
            Crea tu primera estrategia de distribución rellenando el formulario guiado.
          </p>
          <Button variant="primary" onClick={onNew}>
            <Plus size={16} />
            Comenzar ahora
          </Button>
        </div>
      )}

      {/* Estrategias con informe */}
      {!loading && withReport.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-cinema-text-dim mb-3 flex items-center gap-2">
            <Trophy size={12} className="text-cinema-gold" />
            Con informe generado
          </h3>
          <ul className="space-y-3">
            {withReport.map(s => (
              <StrategyCard
                key={s.id}
                strategy={s}
                onViewReport={() => onLoad(s, 'report')}
                onEdit={() => onLoad(s, 'wizard')}
                onDelete={e => handleDelete(s.id, e)}
                isDeleting={deletingId === s.id}
                formatDate={formatDate}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Estrategias en borrador */}
      {!loading && withoutReport.length > 0 && (
        <section>
          {withReport.length > 0 && (
            <h3 className="text-xs font-semibold uppercase tracking-widest text-cinema-text-dim mb-3 flex items-center gap-2">
              <Pencil size={12} />
              Borradores sin informe
            </h3>
          )}
          <ul className="space-y-3">
            {withoutReport.map(s => (
              <StrategyCard
                key={s.id}
                strategy={s}
                onViewReport={null}
                onEdit={() => onLoad(s, 'wizard')}
                onDelete={e => handleDelete(s.id, e)}
                isDeleting={deletingId === s.id}
                formatDate={formatDate}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

interface CardProps {
  strategy: SavedStrategy;
  onViewReport: (() => void) | null;
  onEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
  isDeleting: boolean;
  formatDate: (iso: string) => string;
}

function StrategyCard({ strategy: s, onViewReport, onEdit, onDelete, isDeleting, formatDate }: CardProps) {
  const filmType = s.film_data?.basicInfo?.filmType;
  const genre = s.film_data?.basicInfo?.genre;
  const country = s.film_data?.basicInfo?.country;
  const festivalCount = s.report?.recommendedFestivals?.length;
  const score = s.report?.overallScore;

  return (
    <li className="bg-cinema-card border border-cinema-border rounded-xl p-5 hover:border-cinema-gold/30 transition-all">
      <div className="flex items-start justify-between gap-4">
        {/* Icono + info principal */}
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-11 h-11 rounded-lg bg-cinema-gold/10 flex items-center justify-center shrink-0 mt-0.5">
            <Film size={20} className="text-cinema-gold" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-cinema-text text-base truncate">{s.film_title}</p>

            {/* Chips de metadata */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {filmType && (
                <span className="text-[11px] bg-cinema-dark border border-cinema-border rounded-full px-2 py-0.5 text-cinema-text-dim">
                  {FILM_TYPE_LABELS[filmType] ?? filmType}
                </span>
              )}
              {genre && (
                <span className="text-[11px] bg-cinema-dark border border-cinema-border rounded-full px-2 py-0.5 text-cinema-text-dim">
                  {GENRE_LABELS[genre] ?? genre}
                </span>
              )}
              {country && (
                <span className="text-[11px] bg-cinema-dark border border-cinema-border rounded-full px-2 py-0.5 text-cinema-text-dim">
                  {country}
                </span>
              )}
              {score !== undefined && <ScoreBadge score={score} />}
              {festivalCount !== undefined && (
                <span className="text-[11px] bg-cinema-gold/10 border border-cinema-gold/20 rounded-full px-2 py-0.5 text-cinema-gold">
                  {festivalCount} festivales
                </span>
              )}
            </div>

            {/* Fecha */}
            <div className="flex items-center gap-1 text-cinema-text-dim text-xs mt-2">
              <Clock size={10} />
              <span>Actualizada el {formatDate(s.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Botón eliminar */}
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-2 rounded-lg text-cinema-text-dim hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0 opacity-40 hover:opacity-100"
          title="Eliminar estrategia"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-cinema-border">
        {onViewReport && (
          <button
            onClick={onViewReport}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-gold text-cinema-black font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-all"
          >
            <FileText size={14} />
            Ver informe
          </button>
        )}
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 bg-cinema-dark border border-cinema-border text-cinema-text text-sm px-4 py-2 rounded-lg hover:border-cinema-gold/40 hover:text-cinema-gold transition-all"
        >
          <Pencil size={14} />
          {onViewReport ? 'Editar datos' : 'Continuar editando'}
        </button>
      </div>
    </li>
  );
}
