import type { MaterialStatus } from '../../types/film';
import clsx from 'clsx';

interface MaterialStatusSelectProps {
  label: string;
  value: MaterialStatus | undefined;
  onChange: (value: MaterialStatus) => void;
}

const STATUS_OPTIONS: { value: MaterialStatus; label: string; color: string }[] = [
  { value: 'listo', label: 'Listo', color: 'text-green-400' },
  { value: 'en_proceso', label: 'En proceso', color: 'text-yellow-400' },
  { value: 'no_disponible', label: 'No disponible', color: 'text-red-400' },
];

export function MaterialStatusSelect({ label, value, onChange }: MaterialStatusSelectProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-cinema-border last:border-0">
      <span className="text-sm text-cinema-text">{label}</span>
      <div className="flex gap-1">
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              'px-3 py-1 text-xs rounded-full border transition-all',
              value === opt.value
                ? `border-current ${opt.color} bg-current/10 font-semibold`
                : 'border-cinema-border text-cinema-muted hover:border-cinema-gold/40',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
