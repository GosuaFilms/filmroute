import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { Header } from './components/layout/Header';
import { StepIndicator } from './components/layout/StepIndicator';
import { Step1BasicInfo } from './components/steps/Step1BasicInfo';
import { Step2CreativeDetails } from './components/steps/Step2CreativeDetails';
import { Step3Materials } from './components/steps/Step3Materials';
import { Step4Distribution } from './components/steps/Step4Distribution';
import { Step5Festivals } from './components/steps/Step5Festivals';
import { Step6Budget } from './components/steps/Step6Budget';
import { Step7Review } from './components/steps/Step7Review';
import { StrategyReportView } from './components/report/StrategyReport';
import { Dashboard } from './components/dashboard/Dashboard';
import { Button } from './components/ui/Button';
import { generateStrategy } from './utils/strategyEngine';
import { exportReportToPDF } from './utils/pdfExport';
import { saveStrategy, updateStrategy, type SavedStrategy } from './lib/strategies';
import type { FilmData, StrategyReport } from './types/film';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TOTAL_STEPS = 7;

const EMPTY_DATA: FilmData = {
  basicInfo: {},
  creativeDetails: {},
  materials: {},
  distributionGoals: {},
  festivalStrategy: {},
  budgetResources: {},
};

type View = 'dashboard' | 'wizard' | 'report';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [currentStep, setCurrentStep] = useState(1);
  const [filmData, setFilmData] = useState<FilmData>(EMPTY_DATA);
  const [report, setReport] = useState<StrategyReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentStrategyId, setCurrentStrategyId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateData = useCallback((partial: Partial<FilmData>) => {
    setFilmData(prev => ({ ...prev, ...partial }));
  }, []);

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

  if (!user) return <AuthPage />;

  const goNext = () => setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS));
  const goPrev = () => setCurrentStep(s => Math.max(s - 1, 1));

  const handleNew = () => {
    setFilmData(EMPTY_DATA);
    setReport(null);
    setCurrentStrategyId(null);
    setSaveError(null);
    setCurrentStep(1);
    setView('wizard');
  };

  const handleLoad = (strategy: SavedStrategy) => {
    setFilmData(strategy.film_data);
    setReport(strategy.report);
    setCurrentStrategyId(strategy.id);
    setSaveError(null);
    setCurrentStep(1);
    if (strategy.report) {
      setView('report');
    } else {
      setView('wizard');
    }
  };

  const handleGenerate = async () => {
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
          <Dashboard onNew={handleNew} onLoad={handleLoad} />
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
          <StrategyReportView
            report={report}
            onBack={handleBackToWizard}
            onExport={handleExport}
            isExporting={isExporting}
          />
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
        {currentStep === 1 && <Step1BasicInfo data={filmData.basicInfo} onChange={updateData} />}
        {currentStep === 2 && <Step2CreativeDetails data={filmData.creativeDetails} onChange={updateData} />}
        {currentStep === 3 && <Step3Materials data={filmData.materials} onChange={updateData} />}
        {currentStep === 4 && <Step4Distribution data={filmData.distributionGoals} onChange={updateData} />}
        {currentStep === 5 && <Step5Festivals data={filmData.festivalStrategy} onChange={updateData} />}
        {currentStep === 6 && <Step6Budget data={filmData.budgetResources} onChange={updateData} />}
        {currentStep === 7 && (
          <Step7Review data={filmData} onGenerate={handleGenerate} isGenerating={isGenerating} />
        )}

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
