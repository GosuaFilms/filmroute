import { useEffect, useState } from 'react';
import { X, Download, Trash2, AlertTriangle, CreditCard } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { deleteMyAccount, exportMyData } from '../../lib/account';
import { getBillingSummary, openBillingPortal, type BillingSummary } from '../../lib/billing';

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', trialing: 'En prueba', past_due: 'Pago pendiente', unpaid: 'Impagado',
  canceled: 'Cancelado', incomplete: 'Pago incompleto', incomplete_expired: 'Caducado', paused: 'En pausa',
};

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

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
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    getBillingSummary().then(setBilling).catch(() => setBilling(null));
  }, []);

  async function handlePortal() {
    setOpeningPortal(true);
    setError(null);
    try {
      await openBillingPortal();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo abrir el portal de pagos');
      setOpeningPortal(false);
    }
  }

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

  // Con una suscripción viva, Stripe seguiría cobrando aunque se borre la cuenta
  const mustCancelPlan = !!billing?.subscription
    && ['active', 'trialing', 'past_due'].includes(billing.subscription.status)
    && !billing.subscription.cancelAtPeriodEnd;

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

          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-cinema-text"><CreditCard size={15} className="text-cinema-gold" /> Plan y pagos</h3>
            {!billing ? (
              <p className="text-xs text-cinema-text-dim">Cargando…</p>
            ) : (
              <>
                {billing.subscription && (
                  <div className="text-sm bg-cinema-dark/60 border border-cinema-border rounded-lg px-3 py-2">
                    <p className="text-cinema-text">
                      Plan productora ({billing.subscription.interval === 'year' ? 'anual' : 'mensual'}) ·{' '}
                      <span className="text-cinema-gold">{STATUS_LABELS[billing.subscription.status] ?? billing.subscription.status}</span>
                    </p>
                    {billing.subscription.currentPeriodEnd && (
                      <p className="text-xs text-cinema-text-dim mt-0.5">
                        {billing.subscription.cancelAtPeriodEnd ? 'Termina el ' : 'Se renueva el '}
                        {fmtDate(billing.subscription.currentPeriodEnd)}
                      </p>
                    )}
                  </div>
                )}
                {billing.licenses.length > 0 && (
                  <ul className="space-y-1.5">
                    {billing.licenses.map(l => (
                      <li key={l.id} className="text-sm bg-cinema-dark/60 border border-cinema-border rounded-lg px-3 py-2">
                        <p className="text-cinema-text">
                          {l.strategies?.film_title ? `Licencia: «${l.strategies.film_title}»` : 'Licencia de película sin usar'}
                        </p>
                        <p className="text-xs text-cinema-text-dim mt-0.5">
                          {l.strategy_id
                            ? `${Math.max(l.analyses_limit - l.analyses_used, 0)} de ${l.analyses_limit} análisis disponibles${l.expires_at ? ` · válida hasta el ${fmtDate(l.expires_at)}` : ''}`
                            : 'Se asignará a la próxima película que analices'}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                {!billing.subscription && billing.licenses.length === 0 && (
                  <p className="text-xs text-cinema-text-dim">Todavía no tienes ningún plan ni licencia. Podrás comprarlos al generar el análisis de una película.</p>
                )}
                {billing.hasCustomer && (
                  <button onClick={handlePortal} disabled={openingPortal || deleting}
                    className="inline-flex items-center gap-2 border border-cinema-border text-cinema-text text-sm px-4 py-2 rounded-lg hover:border-cinema-gold/50 hover:text-cinema-gold transition-all disabled:opacity-60">
                    {openingPortal ? 'Abriendo…' : 'Gestionar suscripción y facturas'}
                  </button>
                )}
              </>
            )}
          </section>

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
              {mustCancelPlan && (
                <strong className="block mt-2 text-red-400">Antes de eliminar la cuenta, cancela tu plan productora en «Gestionar suscripción y facturas».</strong>
              )}
            </p>
            <label className="block text-xs text-cinema-text-dim">
              Escribe <strong className="text-cinema-text">{CONFIRM_WORD}</strong> para confirmar:
              <input value={confirmText} onChange={e => setConfirmText(e.target.value)} disabled={deleting}
                className="mt-1.5 w-full bg-cinema-dark border border-cinema-border rounded-lg px-3 py-2 text-cinema-text text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60" />
            </label>
            <button onClick={handleDelete} disabled={deleting || mustCancelPlan || confirmText.trim().toUpperCase() !== CONFIRM_WORD}
              className="inline-flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <Trash2 size={14} /> {deleting ? 'Eliminando…' : 'Eliminar mi cuenta definitivamente'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
