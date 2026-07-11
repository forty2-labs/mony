import type { ReactNode } from 'react';

import { cn } from '../lib/cn';
import { Icon, type IconName } from './Icon';

type Accent = 'brand' | 'success' | 'danger' | 'warning' | 'neutral';

const ACCENT: Record<Accent, { text: string; chip: string; glow: string }> = {
  brand: { text: 'text-brand', chip: 'bg-brand/10 text-brand', glow: 'rgb(var(--brand) / 0.16)' },
  success: {
    text: 'text-success',
    chip: 'bg-success/10 text-success',
    glow: 'rgb(var(--success) / 0.16)',
  },
  danger: {
    text: 'text-danger',
    chip: 'bg-danger/10 text-danger',
    glow: 'rgb(var(--danger) / 0.16)',
  },
  warning: {
    text: 'text-warning',
    chip: 'bg-warning/10 text-warning',
    glow: 'rgb(var(--warning) / 0.16)',
  },
  neutral: {
    text: 'text-content',
    chip: 'bg-surface-2 text-content-muted',
    glow: 'rgb(0 0 0 / 0)',
  },
};

export function StatCard({
  label,
  value,
  hint,
  accent = 'neutral',
  icon,
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: Accent;
  icon?: IconName;
  children?: ReactNode;
}) {
  const a = ACCENT[accent];
  return (
    <div className="card relative overflow-hidden p-5">
      {/* soft corner glow tinted by accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
        style={{ background: a.glow }}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-content-muted">{label}</p>
        {icon ? (
          <span className={cn('grid h-8 w-8 place-items-center rounded-xl', a.chip)}>
            <Icon name={icon} size={16} />
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          'mt-2 text-[1.65rem] font-semibold leading-tight tracking-tight tabular-nums',
          accent !== 'neutral' && a.text,
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-content-muted">{hint}</p> : null}
      {children}
    </div>
  );
}
