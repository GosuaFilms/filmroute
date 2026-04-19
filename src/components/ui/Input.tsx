import { type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-cinema-text">
        {label}
        {props.required && <span className="text-cinema-gold ml-1">*</span>}
      </label>
      <input
        id={inputId}
        className={clsx(
          'bg-cinema-card border rounded-lg px-4 py-2.5 text-cinema-text placeholder-cinema-muted text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-cinema-gold/50 focus:border-cinema-gold',
          error ? 'border-red-500' : 'border-cinema-border hover:border-cinema-gold/50',
          className,
        )}
        {...props}
      />
      {hint && <p className="text-xs text-cinema-text-dim">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
