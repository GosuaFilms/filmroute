import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Film, Building2, ShieldCheck } from 'lucide-react';
import { startCheckout, openBillingPortal, type CheckoutPlan } from '../../lib/billing';
import type { PaymentRequired } from '../../lib/aiAdvisor';

interface Props {
  reason: PaymentRequired;
  filmTitle: string;
  strategyId: string | null;
  onClose: () => void;
}

const FILM_FEATURES = ['Estrategia completa con el asesor IA', 'Hasta 5 actualizaciones durante 12 meses', 'Informe en PDF y seguimiento de envíos'];
const PLAN_FEATURES = ['Hasta 5 películas activas', 'Hasta 25 análisis al mes', 'Cancela cuando quieras'];

export function PaywallModal({ reason, filmTitle, strategyId, onClose }: Props) {
  const [busy, setBusy] = useState<CheckoutPlan | 'portal' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const planLimit = reason.code === 'monthly_limit' || reason.code === 'films_limit';

  async function go(plan: CheckoutPlan) {
    setBusy(plan);
    setError(null);
    try {
      await startCheckout(plan, strategyId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo abrir la página de pago');
      setBusy(null);
    }
  }

  async function portal() {
    setBusy('portal');
    setError(null);
    try {
      await openBillingPortal();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo abrir el portal de pagos');
      setBusy(null);
    }
  }

  const title = reason.code === 'film_exhausted'
    ? 'Has usado los análisis de esta película'
    : planLimit ? 'Has llegado al límite de tu plan' : `Desbloquea el análisis de «${filmTitle}»`;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-cinema-card border border-cinema-border rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 className="text-xl font-display font-bold text-cinema-text">{title}</h2>
            <p className="text-sm text-cinema-text-dim mt-1">{reason.message}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-cinema-text-dim hover:text-cinema-text hover:bg-cinema-dark transition-all shrink-0">
            <X size={18} />
          </button>
        </div>

        {error && <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

        {planLimit ? (
          <div className="p-6">
            <p className="text-sm text-cinema-text-dim mb-4">
              El cupo se renueva a medida que pasan 30 días desde cada análisis. Si necesitas más, escríbenos a
              info@luratlantik.com y lo vemos.
            </p>
            <button onClick={portal} disabled={busy !== null}
              className="border border-cinema-border text-cinema-text text-sm px-4 py-2 rounded-lg hover:border-cinema-gold/50 hover:text-cinema-gold transition-all disabled:opacity-60">
              {busy === 'portal' ? 'Abriendo…' : 'Gestionar mi plan'}
            </button>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-cinema-gold/50 bg-cinema-gold/10 p-5 flex flex-col">
              <div className="flex items-center gap-2 text-cinema-gold mb-2"><Film size={16} /><span className="text-sm font-semibold">Esta película</span></div>
              <p className="mb-3"><span className="text-3xl font-bold text-cinema-text">69 €</span> <span className="text-sm text-cinema-text-dim">pago único</span></p>
              <ul className="space-y-1.5 mb-5 flex-1">
                {FILM_FEATURES.map(f => <li key={f} className="flex gap-2 text-sm text-cinema-text-dim"><Check size={14} className="text-cinema-gold shrink-0 mt-0.5" />{f}</li>)}
              </ul>
              <button onClick={() => go('film')} disabled={busy !== null}
                className="w-full bg-gradient-gold text-cinema-black font-bold text-sm rounded-lg py-2.5 hover:opacity-90 transition-all disabled:opacity-60">
                {busy === 'film' ? 'Abriendo el pago…' : 'Comprar por 69 €'}
              </button>
            </div>
            <div className="rounded-xl border border-cinema-border p-5 flex flex-col">
              <div className="flex items-center gap-2 text-cinema-text mb-2"><Building2 size={16} /><span className="text-sm font-semibold">Plan productora</span></div>
              <p className="mb-3"><span className="text-3xl font-bold text-cinema-text">99 €</span> <span className="text-sm text-cinema-text-dim">/ mes</span></p>
              <ul className="space-y-1.5 mb-5 flex-1">
                {PLAN_FEATURES.map(f => <li key={f} className="flex gap-2 text-sm text-cinema-text-dim"><Check size={14} className="text-cinema-gold shrink-0 mt-0.5" />{f}</li>)}
              </ul>
              <button onClick={() => go('monthly')} disabled={busy !== null}
                className="w-full border border-cinema-border text-cinema-text font-semibold text-sm rounded-lg py-2.5 hover:border-cinema-gold hover:text-cinema-gold transition-all disabled:opacity-60">
                {busy === 'monthly' ? 'Abriendo el pago…' : 'Suscribirme por 99 €/mes'}
              </button>
              <button onClick={() => go('yearly')} disabled={busy !== null}
                className="mt-2 text-xs text-cinema-text-dim hover:text-cinema-gold transition-colors disabled:opacity-60">
                {busy === 'yearly' ? 'Abriendo el pago…' : 'O 990 € al año (dos meses gratis)'}
              </button>
            </div>
          </div>
        )}

        <p className="flex items-center gap-2 text-xs text-cinema-muted px-6 pb-6">
          <ShieldCheck size={14} className="text-cinema-gold shrink-0" />
          Precios con IVA incluido. Pago seguro con Stripe. Si tu primer informe no te resulta útil, te devolvemos el dinero en 14 días.
        </p>
      </div>
    </div>,
    document.body,
  );
}
