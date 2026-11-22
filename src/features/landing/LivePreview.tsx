import { lazy, Suspense, useMemo, useState } from 'react';

import type { RangeKey } from '@/features/reports/report';
import { Delta } from '@/features/reports/ReportSections';
import { Skeleton } from '@/shared/components/Skeleton';
import { StatCard } from '@/shared/components/StatCard';
import { cn } from '@/shared/lib/cn';
import { formatMoney } from '@/shared/lib/format';

import { sampleReport } from './sampleData';

const TrendAreaChart = lazy(() =>
  import('@/features/reports/ReportCharts').then((m) => ({ default: m.TrendAreaChart })),
);

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'last_month', label: 'Last month' },
  { key: 'last_3_months', label: '3 months' },
  { key: 'last_12_months', label: '12 months' },
];

/**
 * The real dashboard pieces (stat cards, delta lines, trend chart) running on
 * the fictional sample year. Switching the range recomputes every figure in the
 * browser; nothing is fetched.
 */
export function LivePreview() {
  const [key, setKey] = useState<RangeKey>('last_12_months');
  const report = useMemo(() => sampleReport({ key }), [key]);
  // The sample year has no history before it, so an empty previous window would
  // show the whole total as growth. Compare only when there is something to compare.
  const prev =
    report.prev && report.prev.totalIncome + report.prev.totalExpenses > 0
      ? report.prev
      : undefined;

  return (
    <div className="card p-4 shadow-soft-lg sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-content-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
          Sample data
        </span>
        <div
          role="group"
          aria-label="Preview period"
          className="inline-flex rounded-full border border-border bg-surface p-1"
        >
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              aria-pressed={key === r.key}
              onClick={() => setKey(r.key)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition',
                key === r.key ? 'bg-brand text-brand-fg' : 'text-content-muted hover:text-content',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          feature
          label="Net saved"
          value={formatMoney(report.net)}
          accent={report.net < 0 ? 'danger' : 'brand'}
          icon="trending-up"
          tag={
            report.savingsRate == null ? undefined : `${Math.round(report.savingsRate)}% of income`
          }
        />
        <StatCard
          label="Income"
          value={formatMoney(report.totalIncome)}
          accent="success"
          icon="income"
        >
          <Delta current={report.totalIncome} previous={prev?.totalIncome} higherIsGood />
        </StatCard>
        <StatCard
          label="Spending"
          value={formatMoney(report.totalExpenses)}
          accent="danger"
          icon="expenses"
        >
          <Delta
            current={report.totalExpenses}
            previous={prev?.totalExpenses}
            higherIsGood={false}
          />
        </StatCard>
        <StatCard
          label="Avg monthly spend"
          value={formatMoney(report.avgMonthlyExpenses)}
          icon="budgets"
          hint={`${report.txCount} transactions`}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-border p-3 sm:p-4">
        <Suspense fallback={<Skeleton className="h-80 w-full" />}>
          <TrendAreaChart data={report.trend} />
        </Suspense>
      </div>
    </div>
  );
}
