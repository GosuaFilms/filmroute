import type { ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, description, children, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-cinema-card border border-cinema-border rounded-xl p-6 ${className}`}>
      {title && (
        <div className="mb-5">
          <h3 className="text-base font-semibold text-cinema-gold">{title}</h3>
          {description && <p className="text-xs text-cinema-text-dim mt-1">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
