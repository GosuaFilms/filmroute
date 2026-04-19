import { Check } from 'lucide-react';
import clsx from 'clsx';

interface Step {
  number: number;
  label: string;
  icon: string;
}

const STEPS: Step[] = [
  { number: 1, label: 'Información básica', icon: '🎬' },
  { number: 2, label: 'Detalles creativos', icon: '✍️' },
  { number: 3, label: 'Materiales', icon: '📦' },
  { number: 4, label: 'Distribución', icon: '🌍' },
  { number: 5, label: 'Festivales', icon: '🏆' },
  { number: 6, label: 'Presupuesto', icon: '💰' },
  { number: 7, label: 'Estrategia', icon: '📊' },
];

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-max mx-auto px-4">
        {STEPS.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2',
                  {
                    'bg-cinema-gold border-cinema-gold text-cinema-black shadow-lg shadow-cinema-gold/30': currentStep === step.number,
                    'bg-cinema-gold/20 border-cinema-gold text-cinema-gold': currentStep > step.number,
                    'bg-cinema-card border-cinema-border text-cinema-muted': currentStep < step.number,
                  },
                )}
              >
                {currentStep > step.number ? (
                  <Check size={16} strokeWidth={2.5} />
                ) : (
                  <span className="text-xs">{step.number}</span>
                )}
              </div>
              <span
                className={clsx(
                  'text-[10px] font-medium text-center max-w-[72px] leading-tight transition-colors',
                  {
                    'text-cinema-gold': currentStep === step.number,
                    'text-cinema-text-dim': currentStep !== step.number,
                  },
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={clsx(
                  'h-px w-8 sm:w-12 mx-1 mt-[-18px] transition-colors',
                  currentStep > step.number ? 'bg-cinema-gold' : 'bg-cinema-border',
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
