import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export function StatCard({
  label,
  value,
  hint,
  accent,
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: 'brand' | 'success' | 'danger' | 'warning';
  children?: ReactNode;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-content-muted">
        {label}
      </p>
      <p
        className={cn(
          'mt-2 text-2xl font-semibold tracking-tight tabular-nums',
          accent === 'success' && 'text-success',
          accent === 'danger' && 'text-danger',
          accent === 'warning' && 'text-warning',
          accent === 'brand' && 'text-brand',
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-content-muted">{hint}</p> : null}
      {children}
    </div>
  );
}
