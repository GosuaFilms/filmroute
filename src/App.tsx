import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { StepIndicator } from './components/layout/StepIndicator';
import { Button } from './components/ui/Button';

// Vistas lazy — solo se descargan cuando el usuario las necesita
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const StrategyReportView = lazy(() => import('./components/report/StrategyReport').then(m => ({ default: m.StrategyReportView })));
const Step1BasicInfo = lazy(() => import('./components/steps/Step1BasicInfo').then(m => ({ default: m.Step1BasicInfo })));
const Step2CreativeDetails = lazy(() => import('./components/steps/Step2CreativeDetails').then(m => ({ default: m.Step2CreativeDetails })));
const Step3Materials = lazy(() => import('./components/steps/Step3Materials').then(m => ({ default: m.Step3Materials })));
const Step4Distribution = lazy(() => import('./components/steps/Step4Distribution').then(m => ({ default: m.Step4Distribution })));
const Step5Festivals = lazy(() => import('./components/steps/Step5Festivals').then(m => ({ default: m.Step5Festivals })));
const Step6Budget = lazy(() => import('./components/steps/Step6Budget').then(m => ({ default: m.Step6Budget })));
const Step7Review = lazy(() => import('./components/steps/Step7Review').then(m => ({ default: m.Step7Review })));

function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <svg className="animate-spin w-7 h-7 text-cinema-gold" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}
import { generateStrategy } from './utils/strategyEngine';
import { exportReportToPDF } from './utils/pdfExport';
import { saveStrategy, updateStrategy, type SavedStrategy } from './lib/strategies';
import { validateStep, hasErrors, type StepErrors } from './utils/validation';
import type { FilmData, StrategyReport } from './types/film';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TOTAL_STEPS = 7;
const DRAFT_KEY = 'filmroute_draft';

const EMPTY_DATA: FilmData = {
  basicInfo: {},
  creativeDetails: {},
  materials: {},
  distributionGoals: {},
  festivalStrategy: {},
  budgetResources: {},
};

function loadDraft(): FilmData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as FilmData) : null;
  } catch {
    return null;
  }
}

function saveDraft(data: FilmData) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    // localStorage puede estar lleno o bloqueado; ignorar silenciosamente
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

type View = 'dashboard' | 'wizard' | 'report';

function SetNewPasswordView({ updatePassword }: { updatePassword: (p: string) => Promise<{ error: string | null }> }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    const { error } = await updatePassword(password);
    if (error) { setError(error); setLoading(false); return; }
    setDone(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-cinema flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-cinema-card border border-cinema-border rounded-2xl p-8 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-2 text-cinema-gold mb-6">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
          <span className="font-display font-bold text-lg">FilmRoute</span>
        </div>

        {done ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-xl font-display font-bold text-cinema-text mb-2">Contraseña actualizada</h2>
            <p className="text-cinema-text-dim text-sm">Tu contraseña se ha cambiado correctamente. Ya puedes usar la aplicación.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-display font-bold text-cinema-text mb-1">Nueva contraseña</h2>
            <p className="text-cinema-text-dim text-sm mb-6">Introduce y confirma tu nueva contraseña.</p>

            {error && (
              <div className="flex items-start gap-3 bg-red-900/20 border border-red-700/40 rounded-xl p-4 mb-5">
                <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-cinema-text">Nueva contraseña <span className="text-cinema-gold">*</span></label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="bg-cinema-dark border border-cinema-border rounded-lg px-4 py-3 text-cinema-text placeholder-cinema-muted text-sm focus:outline-none focus:ring-2 focus:ring-cinema-gold/50 focus:border-cinema-gold transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-cinema-text">Confirmar contraseña <span className="text-cinema-gold">*</span></label>
                <input
                  type="password"
                  placeholder="Repite la contraseña"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="bg-cinema-dark border border-cinema-border rounded-lg px-4 py-3 text-cinema-text placeholder-cinema-muted text-sm focus:outline-none focus:ring-2 focus:ring-cinema-gold/50 focus:border-cinema-gold transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-gold text-cinema-black font-bold py-3.5 rounded-xl text-sm hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Guardando...</>
                ) : 'Guardar nueva contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading, isRecoveryMode, updatePassword } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [currentStep, setCurrentStep] = useState(1);
  const [filmData, setFilmData] = useState<FilmData>(EMPTY_DATA);
  const [report, setReport] = useState<StrategyReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentStrategyId, setCurrentStrategyId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [stepErrors, setStepErrors] = useState<StepErrors>({});
  const [draftRestored, setDraftRestored] = useState(false);

  const updateData = useCallback((partial: Partial<FilmData>) => {
    setFilmData(prev => ({ ...prev, ...partial }));
  }, []);

  // Restaurar borrador al entrar al wizard si no hay estrategia cargada
  useEffect(() => {
    if (view === 'wizard' && !currentStrategyId) {
      const draft = loadDraft();
      if (draft && draft.basicInfo?.title) {
        setFilmData(draft);
        setDraftRestored(true);
        const timer = setTimeout(() => setDraftRestored(false), 4000);
        return () => clearTimeout(timer);
      }
    }
  // Solo al montar el wizard por primera vez
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Auto-guardar borrador en localStorage cada vez que cambia filmData
  useEffect(() => {
    if (view === 'wizard') {
      saveDraft(filmData);
    }
  }, [filmData, view]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-cinema flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-8 h-8 text-cinema-gold" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-cinema-text-dim text-sm">Cargando FilmRoute...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Suspense fallback={<PageSpinner />}><AuthPage /></Suspense>;

  if (isRecoveryMode) return <SetNewPasswordView updatePassword={updatePassword} />;

  const goNext = () => {
    const errors = validateStep(currentStep, filmData);
    if (hasErrors(errors)) {
      setStepErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setStepErrors({});
    setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const goPrev = () => {
    setStepErrors({});
    setCurrentStep(s => Math.max(s - 1, 1));
  };

  const handleNew = () => {
    clearDraft();
    setFilmData(EMPTY_DATA);
    setReport(null);
    setCurrentStrategyId(null);
    setSaveError(null);
    setStepErrors({});
    setDraftRestored(false);
    setCurrentStep(1);
    setView('wizard');
  };

  const handleLoad = (strategy: SavedStrategy, mode: 'report' | 'wizard') => {
    setFilmData(strategy.film_data);
    setReport(strategy.report);
    setCurrentStrategyId(strategy.id);
    setSaveError(null);
    setStepErrors({});
    setDraftRestored(false);
    setCurrentStep(1);
    setView(mode === 'report' && strategy.report ? 'report' : 'wizard');
  };

  const handleGenerate = async () => {
    const errors = validateStep(7, filmData);
    if (hasErrors(errors)) {
      setStepErrors(errors);
      return;
    }
    setStepErrors({});
    setIsGenerating(true);
    setSaveError(null);
    await new Promise(r => setTimeout(r, 800));
    const result = generateStrategy(filmData);
    setReport(result);
    setView('report');
    setIsGenerating(false);

    // Guardar en Supabase en segundo plano
    setIsSaving(true);
    try {
      if (currentStrategyId) {
        await updateStrategy(currentStrategyId, filmData, result);
      } else {
        const saved = await saveStrategy(filmData, result);
        setCurrentStrategyId(saved.id);
      }
      clearDraft();
    } catch {
      setSaveError('No se pudo guardar la estrategia en la nube. Puedes exportarla a PDF.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (!report) return;
    setIsExporting(true);
    try {
      await exportReportToPDF(report);
    } catch (e) {
      console.error('Error exportando PDF:', e);
      alert('Error al exportar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackToWizard = () => {
    setReport(null);
    setCurrentStep(7);
    setView('wizard');
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setSaveError(null);
  };

  // Dashboard
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-cinema flex flex-col">
        <Header onLogoClick={handleBackToDashboard} />
        <main className="flex-1">
          <Suspense fallback={<PageSpinner />}>
            <Dashboard onNew={handleNew} onLoad={handleLoad} />
          </Suspense>
        </main>
        <footer className="border-t border-cinema-border py-6 text-center">
          <p className="text-cinema-text-dim text-xs">
            FilmRoute — Herramienta de distribución para cineastas independientes
          </p>
        </footer>
      </div>
    );
  }

  // Report view
  if (view === 'report' && report) {
    return (
      <div className="min-h-screen bg-gradient-cinema">
        <Header onLogoClick={handleBackToDashboard} />
        <main className="max-w-5xl mx-auto px-4 py-8">
          {saveError && (
            <div className="mb-4 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-400 text-sm">
              <span>⚠️</span> {saveError}
            </div>
          )}
          {isSaving && (
            <div className="mb-4 flex items-center gap-2 text-cinema-text-dim text-xs">
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando en la nube...
            </div>
          )}
          <Suspense fallback={<PageSpinner />}>
            <StrategyReportView
              report={report}
              onBack={handleBackToWizard}
              onExport={handleExport}
              isExporting={isExporting}
            />
          </Suspense>
        </main>
      </div>
    );
  }

  // Form wizard
  return (
    <div className="min-h-screen bg-gradient-cinema">
      <Header onLogoClick={handleBackToDashboard} />

      <div className="sticky top-[61px] z-30 bg-cinema-dark/90 backdrop-blur-sm border-b border-cinema-border py-4">
        <div className="max-w-5xl mx-auto px-4">
          <StepIndicator currentStep={currentStep} />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {draftRestored && (
          <div className="mb-6 flex items-center gap-2 bg-cinema-gold/10 border border-cinema-gold/30 rounded-xl px-4 py-3 text-cinema-gold text-sm">
            <span>💾</span>
            <span>Borrador restaurado — tus datos del formulario anterior se han recuperado automáticamente.</span>
          </div>
        )}
        <Suspense fallback={<PageSpinner />}>
          {currentStep === 1 && <Step1BasicInfo data={filmData.basicInfo} onChange={updateData} errors={stepErrors} />}
          {currentStep === 2 && <Step2CreativeDetails data={filmData.creativeDetails} onChange={updateData} errors={stepErrors} />}
          {currentStep === 3 && <Step3Materials data={filmData.materials} onChange={updateData} />}
          {currentStep === 4 && <Step4Distribution data={filmData.distributionGoals} onChange={updateData} errors={stepErrors} />}
          {currentStep === 5 && <Step5Festivals data={filmData.festivalStrategy} onChange={updateData} errors={stepErrors} />}
          {currentStep === 6 && <Step6Budget data={filmData.budgetResources} onChange={updateData} errors={stepErrors} />}
          {currentStep === 7 && (
            <Step7Review data={filmData} onGenerate={handleGenerate} isGenerating={isGenerating} />
          )}
        </Suspense>

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-cinema-border">
          <Button
            variant="secondary"
            onClick={currentStep === 1 ? handleBackToDashboard : goPrev}
          >
            <ChevronLeft size={16} />
            {currentStep === 1 ? 'Mis estrategias' : 'Anterior'}
          </Button>

          <span className="text-cinema-text-dim text-xs">
            Paso {currentStep} de {TOTAL_STEPS}
          </span>

          {currentStep < TOTAL_STEPS ? (
            <Button variant="primary" onClick={goNext}>
              Siguiente
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'Generando...' : 'Generar estrategia'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
