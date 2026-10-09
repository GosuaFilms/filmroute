import { useState } from 'react';
import { X, Download, Trash2, AlertTriangle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { deleteMyAccount, exportMyData } from '../../lib/account';

const CONFIRM_WORD = 'ELIMINAR';

interface Props {
  user: User;
  onClose: () => void;
}

export function AccountModal({ user, onClose }: Props) {
  const [exporting, setExporting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      await exportMyData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron descargar tus datos');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (confirmText.trim().toUpperCase() !== CONFIRM_WORD) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteMyAccount();
      // El cambio de sesión devuelve la app a la página de inicio
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la cuenta');
      setDeleting(false);
    }
  }

  const createdAt = new Date(user.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-cinema-card border border-cinema-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-cinema-border">
          <h2 className="text-lg font-display font-bold text-cinema-text">Mi cuenta</h2>
          <button onClick={onClose} disabled={deleting} className="p-2 rounded-lg text-cinema-text-dim hover:text-cinema-text hover:bg-cinema-dark transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-sm space-y-1">
            {user.user_metadata?.full_name && <p className="text-cinema-text font-medium">{user.user_metadata.full_name}</p>}
            <p className="text-cinema-text-dim">{user.email}</p>
            <p className="text-xs text-cinema-muted">Cuenta creada el {createdAt}</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-cinema-text">Descargar mis datos</h3>
            <p className="text-xs text-cinema-text-dim">
              Un archivo con tus datos de cuenta, todas tus películas, sus informes y tu seguimiento de envíos.
            </p>
            <button onClick={handleExport} disabled={exporting || deleting}
              className="inline-flex items-center gap-2 border border-cinema-border text-cinema-text text-sm px-4 py-2 rounded-lg hover:border-cinema-gold/50 hover:text-cinema-gold transition-all disabled:opacity-60">
              <Download size={14} /> {exporting ? 'Preparando…' : 'Descargar mis datos'}
            </button>
          </section>

          <section className="space-y-3 border border-red-500/30 bg-red-500/5 rounded-xl p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-400">
              <AlertTriangle size={15} /> Eliminar mi cuenta
            </h3>
            <p className="text-xs text-cinema-text-dim">
              Se borrarán de forma permanente tu cuenta, todas tus películas e informes, los carteles subidos y tu
              seguimiento de envíos. No se puede deshacer. Si quieres conservar una copia, descarga antes tus datos.
            </p>
            <label className="block text-xs text-cinema-text-dim">
              Escribe <strong className="text-cinema-text">{CONFIRM_WORD}</strong> para confirmar:
              <input value={confirmText} onChange={e => setConfirmText(e.target.value)} disabled={deleting}
                className="mt-1.5 w-full bg-cinema-dark border border-cinema-border rounded-lg px-3 py-2 text-cinema-text text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60" />
            </label>
            <button onClick={handleDelete} disabled={deleting || confirmText.trim().toUpperCase() !== CONFIRM_WORD}
              className="inline-flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <Trash2 size={14} /> {deleting ? 'Eliminando…' : 'Eliminar mi cuenta definitivamente'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
