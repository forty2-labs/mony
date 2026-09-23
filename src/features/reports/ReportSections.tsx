import { useState } from 'react';

import { CategoryBadge } from '@/shared/components/CategoryBadge';
import { EmptyState } from '@/shared/components/EmptyState';
import { Icon } from '@/shared/components/Icon';
import { Skeleton } from '@/shared/components/Skeleton';
import { cn } from '@/shared/lib/cn';
import { formatMoney } from '@/shared/lib/format';

import type { ReportCategory, ReportData } from './api';
import { downloadSummaryCsv, downloadTransactionsCsv } from './export';

/** Period-over-period change chip, coloured by whether the move is favourable. */
export function Delta({
  current,
  previous,
  higherIsGood,
}: {
  current: number;
  previous: number | undefined;
  higherIsGood: boolean;
}) {
  if (previous == null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.005) {
    return <p className="mt-1 text-xs text-content-muted">No change vs previous period</p>;
  }
  const pct = previous !== 0 ? Math.abs(diff / previous) * 100 : null;
  const up = diff > 0;
  const good = higherIsGood ? up : !up;
  return (
    <p
      className={cn('mt-1 flex items-center gap-1 text-xs', good ? 'text-success' : 'text-danger')}
    >
      <Icon name={up ? 'chevron-up' : 'chevron-down'} size={13} />
      <span className="tabular-nums">
        {formatMoney(Math.abs(diff))}
        {pct != null ? ` · ${Math.round(pct)}%` : ''}
      </span>
      <span className="text-content-muted">vs previous</span>
    </p>
  );
}

/** Ranked category list with bars, used for both expense and income breakdowns. */
export function CategoryTable({
  title,
  empty,
  rows,
  loading,
}: {
  title: string;
  empty: string;
  rows: ReportCategory[] | undefined;
  loading: boolean;
}) {
  return (
    <div className="card p-5">
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      {loading || !rows ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon="reports" title={empty} />
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <li key={c.name} className="flex items-center gap-3">
              <CategoryBadge color={c.color} icon={c.icon} size={30} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2 text-sm">
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto shrink-0 font-medium tabular-nums">
                    {formatMoney(c.total)}
                  </span>
                  <span className="w-9 shrink-0 text-right text-xs tabular-nums text-content-muted">
                    {Math.round(c.pct)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.pct}%`, backgroundColor: c.color }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Small popover of the CSV export options. Closes on outside click via a
 *  full-screen backdrop while open. */
export function ExportMenu({ data }: { data: ReportData | undefined }) {
  const [open, setOpen] = useState(false);
  const disabled = !data || data.txCount === 0;

  return (
    <div className="relative">
      <button
        className="btn-ghost h-9 text-sm"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="download" size={16} />
        Export
        <Icon name="chevron-down" size={14} />
      </button>
      {open && data ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-soft-lg">
            <MenuItem
              label="Transactions (CSV)"
              hint={`${data.txCount} rows`}
              onClick={() => {
                downloadTransactionsCsv(data);
                setOpen(false);
              }}
            />
            <MenuItem
              label="Summary (CSV)"
              hint="Totals + categories"
              onClick={() => {
                downloadSummaryCsv(data);
                setOpen(false);
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function MenuItem({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface-2"
    >
      <Icon name="file" size={15} className="text-content-muted" />
      <span>{label}</span>
      <span className="ml-auto text-xs text-content-muted">{hint}</span>
    </button>
  );
}
