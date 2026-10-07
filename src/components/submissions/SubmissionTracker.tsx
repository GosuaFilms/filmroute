import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Pencil, X, Check, AlertCircle, Send, Trophy, Clock,
  ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';
import {
  listSubmissions, createSubmission, updateSubmission, deleteSubmission,
  type Submission, type SubmissionStatus, type SubmissionInput,
} from '../../lib/submissions';
import { Button } from '../ui/Button';
import type { RecommendedFestival } from '../../types/film';

// ─── Constantes ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pendiente:    { label: 'Pendiente',    color: 'text-cinema-text-dim bg-cinema-dark border-cinema-border', icon: <Clock size={11} /> },
  enviado:      { label: 'Enviado',      color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',          icon: <Send size={11} /> },
  seleccionado: { label: 'Seleccionado', color: 'text-green-400 bg-green-400/10 border-green-400/30',       icon: <Trophy size={11} /> },
  rechazado:    { label: 'Rechazado',    color: 'text-red-400 bg-red-400/10 border-red-400/30',             icon: <X size={11} /> },
  retirado:     { label: 'Retirado',     color: 'text-orange-400 bg-orange-400/10 border-orange-400/30',    icon: <AlertCircle size={11} /> },
};

const TIER_LABELS: Record<string, string> = {
  tier_a: 'Tier A', tier_b: 'Tier B', tier_c: 'Tier C', nacional: 'Nacional', regional: 'Regional',
};

const EMPTY_FORM: Omit<SubmissionInput, 'strategy_id'> = {
  festival_name: '',
  festival_country: '',
  festival_tier: 'tier_b',
  status: 'pendiente',
  submission_date: null,
  deadline: null,
  response_date: null,
  fee_paid: null,
  platform: '',
  notes: '',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Formulario de envío ───────────────────────────────────────────────────────

interface FormProps {
  strategyId: string;
  initial?: Submission;
  suggestedFestivals?: RecommendedFestival[];
  onSave: (s: Submission) => void;
  onCancel: () => void;
}

function SubmissionForm({ strategyId, initial, suggestedFestivals = [], onSave, onCancel }: FormProps) {
  const [form, setForm] = useState<Omit<SubmissionInput, 'strategy_id'>>(
    initial
      ? {
          festival_name: initial.festival_name,
          festival_country: initial.festival_country,
          festival_tier: initial.festival_tier,
          status: initial.status,
          submission_date: initial.submission_date,
          deadline: initial.deadline,
          response_date: initial.response_date,
          fee_paid: initial.fee_paid,
          platform: initial.platform,
          notes: initial.notes,
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const set = (patch: Partial<typeof form>) => setForm(prev => ({ ...prev, ...patch }));

  const fillFromFestival = (f: RecommendedFestival) => {
    set({
      festival_name: f.name,
      festival_country: f.country,
      festival_tier: f.tier,
      platform: f.platform,
    });
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.festival_name.trim()) { setError('El nombre del festival es obligatorio.'); return; }
    setSaving(true);
    setError(null);
    try {
      if (initial) {
        const updated = await updateSubmission(initial.id, { ...form, strategy_id: strategyId });
        onSave(updated);
      } else {
        const created = await createSubmission({ ...form, strategy_id: strategyId });
        onSave(created);
      }
    } catch {
      setError('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-cinema-dark border border-cinema-border rounded-lg px-3 py-2 text-cinema-text text-sm placeholder-cinema-muted focus:outline-none focus:ring-2 focus:ring-cinema-gold/50 focus:border-cinema-gold transition-colors';
  const labelCls = 'block text-xs font-medium text-cinema-text-dim mb-1';

  return (
    <form onSubmit={handleSubmit} className="bg-cinema-card border border-cinema-gold/20 rounded-xl p-5 mb-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-cinema-text">
          {initial ? 'Editar envío' : 'Registrar nuevo envío'}
        </h4>
        <button type="button" onClick={onCancel} className="text-cinema-text-dim hover:text-cinema-text p-1">
          <X size={16} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-xs">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Sugerencias del informe */}
      {!initial && suggestedFestivals.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowSuggestions(v => !v)}
            className="text-xs text-cinema-gold hover:underline flex items-center gap-1"
          >
            {showSuggestions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Rellenar desde festivales del informe ({suggestedFestivals.length})
          </button>
          {showSuggestions && (
            <ul className="mt-2 max-h-48 overflow-y-auto border border-cinema-border rounded-lg divide-y divide-cinema-border">
              {suggestedFestivals.map(f => (
                <li key={f.name}>
                  <button
                    type="button"
                    onClick={() => fillFromFestival(f)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-cinema-gold/5 transition-colors flex items-center justify-between gap-2"
                  >
                    <span className="text-cinema-text font-medium">{f.name}</span>
                    <span className="text-cinema-text-dim shrink-0">{f.country} · {TIER_LABELS[f.tier]}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Fila 1: nombre + país */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls}>Festival <span className="text-cinema-gold">*</span></label>
          <input className={inputCls} value={form.festival_name} onChange={e => set({ festival_name: e.target.value })} placeholder="Nombre del festival" />
        </div>
        <div>
          <label className={labelCls}>País</label>
          <input className={inputCls} value={form.festival_country} onChange={e => set({ festival_country: e.target.value })} placeholder="País" />
        </div>
      </div>

      {/* Fila 2: tier + estado + plataforma */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Tier</label>
          <select className={inputCls} value={form.festival_tier} onChange={e => set({ festival_tier: e.target.value })}>
            {Object.entries(TIER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Estado</label>
          <select className={inputCls} value={form.status} onChange={e => set({ status: e.target.value as SubmissionStatus })}>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Plataforma</label>
          <input className={inputCls} value={form.platform} onChange={e => set({ platform: e.target.value })} placeholder="FilmFreeway…" />
        </div>
      </div>

      {/* Fila 3: fechas + tasa */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className={labelCls}>Deadline</label>
          <input type="date" className={inputCls} value={form.deadline ?? ''} onChange={e => set({ deadline: e.target.value || null })} />
        </div>
        <div>
          <label className={labelCls}>Fecha envío</label>
          <input type="date" className={inputCls} value={form.submission_date ?? ''} onChange={e => set({ submission_date: e.target.value || null })} />
        </div>
        <div>
          <label className={labelCls}>Respuesta</label>
          <input type="date" className={inputCls} value={form.response_date ?? ''} onChange={e => set({ response_date: e.target.value || null })} />
        </div>
        <div>
          <label className={labelCls}>Tasa (€)</label>
          <input type="number" min="0" step="0.01" className={inputCls} value={form.fee_paid ?? ''} onChange={e => set({ fee_paid: e.target.value ? Number(e.target.value) : null })} placeholder="0" />
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className={labelCls}>Notas</label>
        <textarea rows={2} className={inputCls} value={form.notes} onChange={e => set({ notes: e.target.value })} placeholder="Observaciones, contactos, referencias…" />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" variant="primary" size="sm" disabled={saving}>
          {saving ? 'Guardando…' : <><Check size={14} /> {initial ? 'Guardar cambios' : 'Registrar envío'}</>}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

// ─── Fila de envío ─────────────────────────────────────────────────────────────

interface RowProps {
  submission: Submission;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function SubmissionRow({ submission: s, onEdit, onDelete, isDeleting }: RowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = s.deadline || s.submission_date || s.response_date || s.fee_paid || s.notes || s.platform;

  return (
    <li className="bg-cinema-card border border-cinema-border rounded-xl overflow-hidden transition-all hover:border-cinema-gold/20">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-cinema-text text-sm truncate">{s.festival_name}</span>
            {s.festival_country && <span className="text-xs text-cinema-text-dim">{s.festival_country}</span>}
            <span className="text-[11px] text-cinema-text-dim border border-cinema-border rounded-full px-2 py-0.5">{TIER_LABELS[s.festival_tier] ?? s.festival_tier}</span>
            <StatusBadge status={s.status} />
          </div>
          {s.deadline && (
            <p className="text-[11px] text-cinema-text-dim mt-0.5">
              Deadline: {fmtDate(s.deadline)}
              {s.fee_paid != null && <span className="ml-2">· {s.fee_paid.toFixed(0)} €</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hasDetails && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1.5 rounded-lg text-cinema-text-dim hover:text-cinema-text transition-all"
              title="Ver detalles"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <button onClick={onEdit} className="p-1.5 rounded-lg text-cinema-text-dim hover:text-cinema-gold transition-all" title="Editar">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} disabled={isDeleting} className="p-1.5 rounded-lg text-cinema-text-dim hover:text-red-400 transition-all" title="Eliminar">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && hasDetails && (
        <div className="border-t border-cinema-border bg-cinema-dark/50 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {s.submission_date && (
            <div><p className="text-cinema-text-dim mb-0.5">Enviado</p><p className="text-cinema-text">{fmtDate(s.submission_date)}</p></div>
          )}
          {s.response_date && (
            <div><p className="text-cinema-text-dim mb-0.5">Respuesta</p><p className="text-cinema-text">{fmtDate(s.response_date)}</p></div>
          )}
          {s.platform && (
            <div>
              <p className="text-cinema-text-dim mb-0.5">Plataforma</p>
              <p className="text-cinema-text flex items-center gap-1">{s.platform} <ExternalLink size={10} className="opacity-50" /></p>
            </div>
          )}
          {s.fee_paid != null && (
            <div><p className="text-cinema-text-dim mb-0.5">Tasa</p><p className="text-cinema-text">{s.fee_paid.toFixed(2)} €</p></div>
          )}
          {s.notes && (
            <div className="col-span-2 sm:col-span-4">
              <p className="text-cinema-text-dim mb-0.5">Notas</p>
              <p className="text-cinema-text whitespace-pre-wrap">{s.notes}</p>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

interface Props {
  strategyId: string;
  suggestedFestivals?: RecommendedFestival[];
}

const STATUS_ORDER: SubmissionStatus[] = ['seleccionado', 'enviado', 'pendiente', 'rechazado', 'retirado'];

export function SubmissionTracker({ strategyId, suggestedFestivals = [] }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Submission | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<SubmissionStatus | 'todos'>('todos');

  useEffect(() => {
    load();
  }, [strategyId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listSubmissions(strategyId);
      setSubmissions(data);
    } catch {
      setError('No se pudieron cargar los envíos.');
    } finally {
      setLoading(false);
    }
  }

  function handleSaved(s: Submission) {
    setSubmissions(prev =>
      editing
        ? prev.map(x => x.id === s.id ? s : x)
        : [s, ...prev]
    );
    setShowForm(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este envío?')) return;
    setDeletingId(id);
    try {
      await deleteSubmission(id);
      setSubmissions(prev => prev.filter(s => s.id !== id));
    } catch {
      alert('Error al eliminar. Inténtalo de nuevo.');
    } finally {
      setDeletingId(null);
    }
  }

  // Estadísticas rápidas
  const counts = submissions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalFees = submissions.reduce((sum, s) => sum + (s.fee_paid ?? 0), 0);

  const filtered = filterStatus === 'todos'
    ? [...submissions].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
    : submissions.filter(s => s.status === filterStatus);

  return (
    <div className="mt-8 pt-8 border-t border-cinema-border">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-cinema-text flex items-center gap-2">
            <Send size={16} className="text-cinema-gold" />
            Seguimiento de envíos
          </h3>
          <p className="text-xs text-cinema-text-dim mt-0.5">
            {loading ? 'Cargando…' : `${submissions.length} envío${submissions.length !== 1 ? 's' : ''} registrado${submissions.length !== 1 ? 's' : ''}`}
            {totalFees > 0 && ` · ${totalFees.toFixed(0)} € en tasas`}
          </p>
        </div>
        {!showForm && !editing && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Registrar envío
          </Button>
        )}
      </div>

      {/* Stats rápidas */}
      {submissions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(STATUS_CONFIG) as SubmissionStatus[]).map(st => {
            if (!counts[st]) return null;
            const cfg = STATUS_CONFIG[st];
            return (
              <button
                key={st}
                onClick={() => setFilterStatus(prev => prev === st ? 'todos' : st)}
                className={`inline-flex items-center gap-1 border rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${cfg.color} ${filterStatus === st ? 'ring-2 ring-cinema-gold/40' : 'opacity-70 hover:opacity-100'}`}
              >
                {cfg.icon} {cfg.label}: {counts[st]}
              </button>
            );
          })}
          {filterStatus !== 'todos' && (
            <button onClick={() => setFilterStatus('todos')} className="text-[11px] text-cinema-text-dim hover:text-cinema-text underline">
              Ver todos
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Formulario nuevo */}
      {showForm && !editing && (
        <SubmissionForm
          strategyId={strategyId}
          suggestedFestivals={suggestedFestivals}
          onSave={handleSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Formulario edición */}
      {editing && (
        <SubmissionForm
          strategyId={strategyId}
          initial={editing}
          onSave={handleSaved}
          onCancel={() => setEditing(null)}
        />
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-10">
          <svg className="animate-spin w-6 h-6 text-cinema-gold" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-cinema-border rounded-xl">
          <Send size={28} className="text-cinema-text-dim mx-auto mb-3 opacity-30" />
          <p className="text-cinema-text-dim text-sm">
            {filterStatus !== 'todos'
              ? `Sin envíos con estado "${STATUS_CONFIG[filterStatus].label}".`
              : 'Aún no has registrado ningún envío. Empieza añadiendo el primer festival.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map(s => (
            s.id !== editing?.id ? (
              <SubmissionRow
                key={s.id}
                submission={s}
                onEdit={() => { setEditing(s); setShowForm(false); }}
                onDelete={() => handleDelete(s.id)}
                isDeleting={deletingId === s.id}
              />
            ) : null
          ))}
        </ul>
      )}
    </div>
  );
}
