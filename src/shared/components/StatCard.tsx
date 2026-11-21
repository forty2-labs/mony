import type { ReactNode } from 'react';

import { cn } from '../lib/cn';
import { Icon, type IconName } from './Icon';

type Accent = 'brand' | 'success' | 'danger' | 'warning' | 'neutral';

const ACCENT: Record<Accent, { text: string }> = {
  brand: { text: 'text-brand' },
  success: { text: 'text-success' },
  danger: { text: 'text-danger' },
  warning: { text: 'text-warning' },
  neutral: { text: 'text-content' },
};

export function StatCard({
  label,
  value,
  hint,
  tag,
  accent = 'neutral',
  icon,
  feature = false,
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  /** Short qualifier shown beside the label, e.g. a rate behind the figure. */
  tag?: string;
  accent?: Accent;
  icon?: IconName;
  /**
   * Render as the page's one highlighted card (deep green, or lime in dark
   * mode). Use it for a single headline figure; `accent="danger"` still flags
   * a negative value.
   */
  feature?: boolean;
  children?: ReactNode;
}) {
  const a = ACCENT[accent];
  const muted = feature ? 'text-feature-muted' : 'text-content-muted';
  return (
    <div className={cn('relative h-full overflow-hidden p-5', feature ? 'card-feature' : 'card')}>
      {/* Concentric rings echo the round icon badges. Decorative only. */}
      {feature ? (
        <svg
          aria-hidden
          viewBox="0 0 200 200"
          className="pointer-events-none absolute -bottom-20 -right-20 h-52 w-52 opacity-[0.12]"
        >
          <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('text-sm font-medium', feature ? 'text-feature-fg' : 'text-content')}>
            {label}
          </p>
          {tag ? <p className={cn('mt-0.5 text-xs', muted)}>{tag}</p> : null}
        </div>
        {icon ? (
          <span
            className={cn(
              'grid h-10 w-10 shrink-0 place-items-center rounded-full',
              feature ? 'bg-feature-fg/10 text-feature-accent' : 'bg-badge text-badge-fg',
            )}
          >
            <Icon name={icon} size={18} />
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          'mt-3 text-[1.75rem] font-semibold leading-tight tracking-tight tabular-nums',
          feature
            ? accent === 'danger'
              ? 'text-feature-negative'
              : 'text-feature-accent'
            : accent !== 'neutral' && a.text,
        )}
      >
        {value}
      </p>
      {hint ? <p className={cn('mt-1 text-xs', muted)}>{hint}</p> : null}
      {children}
    </div>
  );
}
