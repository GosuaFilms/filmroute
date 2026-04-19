import { type SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, hint, options, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-cinema-text">
        {label}
        {props.required && <span className="text-cinema-gold ml-1">*</span>}
      </label>
      <select
        id={selectId}
        className={clsx(
          'bg-cinema-card border border-cinema-border rounded-lg px-4 py-2.5 text-cinema-text text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-cinema-gold/50 focus:border-cinema-gold',
          'hover:border-cinema-gold/50 appearance-none cursor-pointer',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-cinema-dark">
            {opt.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-cinema-text-dim">{hint}</p>}
    </div>
  );
}
