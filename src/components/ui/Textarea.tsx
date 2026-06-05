import { type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  maxWords?: number;
}

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

export function Textarea({ label, hint, error, maxWords, className, id, ...props }: TextareaProps) {
  const textId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  const wordCount = maxWords !== undefined ? countWords(String(props.value ?? '')) : null;
  const isOverLimit = wordCount !== null && maxWords !== undefined && wordCount > maxWords;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={textId} className="text-sm font-medium text-cinema-text">
          {label}
          {props.required && <span className="text-cinema-gold ml-1">*</span>}
        </label>
        {wordCount !== null && maxWords !== undefined && (
          <span className={clsx(
            'text-xs tabular-nums transition-colors',
            isOverLimit ? 'text-red-400 font-semibold' : wordCount > maxWords * 0.85 ? 'text-yellow-400' : 'text-cinema-text-dim',
          )}>
            {wordCount} / {maxWords} palabras
          </span>
        )}
      </div>
      <textarea
        id={textId}
        className={clsx(
          'bg-cinema-card border rounded-lg px-4 py-2.5 text-cinema-text placeholder-cinema-muted text-sm transition-colors resize-y',
          'focus:outline-none focus:ring-2 focus:ring-cinema-gold/50 focus:border-cinema-gold',
          'hover:border-cinema-gold/50',
          error || isOverLimit ? 'border-red-500' : 'border-cinema-border',
          className,
        )}
        rows={4}
        {...props}
      />
      {hint && <p className="text-xs text-cinema-text-dim">{hint}</p>}
      {isOverLimit && (
        <p className="text-xs text-red-400">
          Te has pasado {wordCount - maxWords} palabra{wordCount - maxWords !== 1 ? 's' : ''} del límite.
        </p>
      )}
      {error && !isOverLimit && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
