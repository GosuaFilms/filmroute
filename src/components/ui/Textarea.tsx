import { type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, className, id, ...props }: TextareaProps) {
  const textId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={textId} className="text-sm font-medium text-cinema-text">
        {label}
        {props.required && <span className="text-cinema-gold ml-1">*</span>}
      </label>
      <textarea
        id={textId}
        className={clsx(
          'bg-cinema-card border rounded-lg px-4 py-2.5 text-cinema-text placeholder-cinema-muted text-sm transition-colors resize-y',
          'focus:outline-none focus:ring-2 focus:ring-cinema-gold/50 focus:border-cinema-gold',
          'hover:border-cinema-gold/50',
          error ? 'border-red-500' : 'border-cinema-border',
          className,
        )}
        rows={4}
        {...props}
      />
      {hint && <p className="text-xs text-cinema-text-dim">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
