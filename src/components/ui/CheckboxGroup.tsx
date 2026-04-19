interface CheckboxGroupProps {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  columns?: 1 | 2 | 3;
}

export function CheckboxGroup({ label, hint, options, selected, onChange, columns = 2 }: CheckboxGroupProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-cinema-text">{label}</span>
      {hint && <p className="text-xs text-cinema-text-dim -mt-1">{hint}</p>}
      <div className={`grid gap-2 ${columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {options.map(opt => (
          <label
            key={opt.value}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                selected.includes(opt.value)
                  ? 'bg-cinema-gold border-cinema-gold'
                  : 'border-cinema-border group-hover:border-cinema-gold/60'
              }`}
              onClick={() => toggle(opt.value)}
            >
              {selected.includes(opt.value) && (
                <svg className="w-3 h-3 text-cinema-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span
              className="text-sm text-cinema-text-dim group-hover:text-cinema-text transition-colors"
              onClick={() => toggle(opt.value)}
            >
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
