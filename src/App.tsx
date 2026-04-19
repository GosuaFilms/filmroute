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
import { Button } from './components/ui/Button';
import { generateStrategy } from './utils/strategyEngine';
import { exportReportToPDF } from './utils/pdfExport';
import type { FilmData, StrategyReport } from './types/film';
import { ChevronLeft, ChevronRight, Film, ArrowRight } from 'lucide-react';

const TOTAL_STEPS = 7;

const EMPTY_DATA: FilmData = {
  basicInfo: {},
  creativeDetails: {},
  materials: {},
  distributionGoals: {},
  festivalStrategy: {},
  budgetResources: {},
};

function AppContent() {
  const { user, loading } = useAuth();
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [filmData, setFilmData] = useState<FilmData>(EMPTY_DATA);
  const [report, setReport] = useState<StrategyReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [_isExporting, setIsExporting] = useState(false);

  const updateData = useCallback((partial: Partial<FilmData>) => {
    setFilmData(prev => ({ ...prev, ...partial }));
  }, []);

  // Auth guard
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

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 800));
    const result = generateStrategy(filmData);
    setReport(result);
    setIsGenerating(false);
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

  const handleBack = () => {
    setReport(null);
    setCurrentStep(7);
  };

  // Landing page
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-cinema flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-3xl w-full text-center">
            <div className="inline-flex items-center gap-2 bg-cinema-gold/10 border border-cinema-gold/30 rounded-full px-4 py-2 mb-8">
              <Film size={14} className="text-cinema-gold" />
              <span className="text-cinema-gold text-xs font-semibold uppercase tracking-widest">Distribución Independiente</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-display font-bold text-cinema-text mb-6 leading-tight">
              Tu película merece<br />
              <span className="text-cinema-gold">llegar al mundo</span>
            </h1>

            <p className="text-cinema-text-dim text-lg mb-4 max-w-xl mx-auto leading-relaxed">
              FilmRoute es la herramienta para que productores, directores y cineastas independientes planifiquen la distribución de su película sin necesitar una gran distribuidora.
            </p>

            <p className="text-cinema-text-dim text-sm mb-10 max-w-lg mx-auto">
              Introduce los datos de tu cortometraje, largometraje o documental y genera en minutos una estrategia completa: circuito de festivales, plan de marketing, ventanas de distribución y exportación PDF.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
              {[
                { icon: '🏆', title: 'Circuito de festivales', desc: '+25 festivales internacionales con deadlines y tasas' },
                { icon: '📱', title: 'Plataformas digitales', desc: 'Netflix, MUBI, Filmin, Amazon y más de 15 plataformas' },
                { icon: '📊', title: 'Informe exportable', desc: 'Descarga tu estrategia en PDF para presentarla a socios' },
              ].map((f, i) => (
                <div key={i} className="bg-cinema-card border border-cinema-border rounded-xl p-5 text-left">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 className="font-semibold text-cinema-text text-sm mb-1">{f.title}</h3>
                  <p className="text-cinema-text-dim text-xs">{f.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStarted(true)}
              className="inline-flex items-center gap-3 bg-gradient-gold text-cinema-black font-bold px-10 py-4 rounded-xl text-base hover:opacity-90 transition-all shadow-2xl shadow-cinema-gold/30"
            >
              Comenzar ahora
              <ArrowRight size={20} />
            </button>

            <p className="text-cinema-text-dim text-xs mt-4">
              Gratuito · Sin registro · Datos privados (todo en tu navegador)
            </p>
          </div>
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
  if (report) {
    return (
      <div className="min-h-screen bg-gradient-cinema">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <StrategyReportView
            report={report}
            onBack={handleBack}
            onExport={handleExport}
          />
        </main>
      </div>
    );
  }

  // Form wizard
  return (
    <div className="min-h-screen bg-gradient-cinema">
      <Header />

      <div className="sticky top-[61px] z-30 bg-cinema-dark/90 backdrop-blur-sm border-b border-cinema-border py-4">
        <div className="max-w-5xl mx-auto px-4">
          <StepIndicator currentStep={currentStep} />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {currentStep === 1 && (
          <Step1BasicInfo
            data={filmData.basicInfo}
            onChange={updateData}
          />
        )}
        {currentStep === 2 && (
          <Step2CreativeDetails
            data={filmData.creativeDetails}
            onChange={updateData}
          />
        )}
        {currentStep === 3 && (
          <Step3Materials
            data={filmData.materials}
            onChange={updateData}
          />
        )}
        {currentStep === 4 && (
          <Step4Distribution
            data={filmData.distributionGoals}
            onChange={updateData}
          />
        )}
        {currentStep === 5 && (
          <Step5Festivals
            data={filmData.festivalStrategy}
            onChange={updateData}
          />
        )}
        {currentStep === 6 && (
          <Step6Budget
            data={filmData.budgetResources}
            onChange={updateData}
          />
        )}
        {currentStep === 7 && (
          <Step7Review
            data={filmData}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-cinema-border">
          <Button
            variant="secondary"
            onClick={currentStep === 1 ? () => setStarted(false) : goPrev}
          >
            <ChevronLeft size={16} />
            {currentStep === 1 ? 'Inicio' : 'Anterior'}
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
