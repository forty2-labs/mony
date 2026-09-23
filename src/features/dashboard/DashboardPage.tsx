import { lazy, Suspense, useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';

import { useAuth } from '@/features/auth/AuthProvider';
import type { ExpenseInput } from '@/features/expenses/api';
import { ExpenseFormModal } from '@/features/expenses/ExpenseFormModal';
import { useExpenseMutations } from '@/features/expenses/hooks';
import { RANGE_OPTIONS, type RangeKey } from '@/features/reports/api';
import { useReport } from '@/features/reports/hooks';
import { CategoryTable, Delta, ExportMenu } from '@/features/reports/ReportSections';
import { CategoryBadge } from '@/shared/components/CategoryBadge';
import { EmptyState } from '@/shared/components/EmptyState';
import { Icon } from '@/shared/components/Icon';
import { PageHeader } from '@/shared/components/PageHeader';
import { Select } from '@/shared/components/Select';
import { Skeleton } from '@/shared/components/Skeleton';
import { StatCard } from '@/shared/components/StatCard';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/lib/cn';
import { formatDate, formatMoney } from '@/shared/lib/format';

import type { RecentTx } from './api';
import { ExpenseHeatmap } from './ExpenseHeatmap';
import { useExpenseHeatmap, useOverview } from './hooks';

// Recharts is heavy — split it into its own chunk loaded on demand.
const TrendAreaChart = lazy(() =>
  import('@/features/reports/ReportCharts').then((m) => ({ default: m.TrendAreaChart })),
);
const CategoryDonut = lazy(() =>
  import('@/features/reports/ReportCharts').then((m) => ({ default: m.CategoryDonut })),
);

/** A gentle rise-and-fade used to stagger the stat cards in on load. */
const CARD_VARIANT = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
} as const;

/** Money value that tweens from its previous figure to the new one — so totals
 *  visibly count up on load and glide when the range changes. */
function AnimatedMoney({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => formatMoney(v));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.7, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [mv, value]);
  return <motion.span>{text}</motion.span>;
}

function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const { user } = useAuth();
  const name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'there';

  const [range, setRange] = useState<RangeKey>('last_6_months');
  const { data: report, isLoading } = useReport(range);
  const { data: overview } = useOverview();
  const { data: heatmap, isLoading: heatmapLoading } = useExpenseHeatmap();
  const { create } = useExpenseMutations();
  const toast = useToast();
  const [quickAdd, setQuickAdd] = useState(false);

  const handleQuickAdd = (input: ExpenseInput) => {
    create.mutate(input, {
      onSuccess: () => {
        toast.success('Expense added');
        setQuickAdd(false);
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : 'Save failed'),
    });
  };

  return (
    <div>
      <PageHeader
        title={`${greetingFor()}, ${name}`}
        subtitle="Your financial overview at a glance."
        actions={
          <div data-print-hide className="flex items-center gap-2">
            <ExportMenu data={report} />
            <button className="btn-ghost h-9 text-sm" onClick={() => window.print()}>
              <Icon name="file" size={16} />
              Print / PDF
            </button>
            <button className="btn-primary" onClick={() => setQuickAdd(true)}>
              <Icon name="plus" size={16} />
              Quick add
            </button>
          </div>
        }
      />

      {/* Range picker */}
      <div data-print-hide className="mb-4 flex items-center gap-2">
        <Select
          value={range}
          onChange={(e) => setRange(e.target.value as RangeKey)}
          wrapperClassName="w-52"
          aria-label="Report range"
        >
          {RANGE_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </Select>
        {report ? (
          <span className="text-sm text-content-muted">
            {report.range.from} → {report.range.to}
          </span>
        ) : null}
      </div>

      {/* Stat cards */}
      {isLoading || !report ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        >
          <motion.div variants={CARD_VARIANT}>
            <StatCard
              label="Balance"
              value={overview ? <AnimatedMoney value={overview.balance} /> : '—'}
              accent={overview && overview.balance < 0 ? 'danger' : 'brand'}
              icon="wallet"
              hint="All-time income − expenses"
            />
          </motion.div>
          <motion.div variants={CARD_VARIANT}>
            <StatCard
              label="Income"
              value={<AnimatedMoney value={report.totalIncome} />}
              accent="success"
              icon="income"
            >
              <Delta
                current={report.totalIncome}
                previous={report.prev?.totalIncome}
                higherIsGood
              />
            </StatCard>
          </motion.div>
          <motion.div variants={CARD_VARIANT}>
            <StatCard
              label="Expenses"
              value={<AnimatedMoney value={report.totalExpenses} />}
              accent="danger"
              icon="expenses"
            >
              <Delta
                current={report.totalExpenses}
                previous={report.prev?.totalExpenses}
                higherIsGood={false}
              />
            </StatCard>
          </motion.div>
          <motion.div variants={CARD_VARIANT}>
            <StatCard
              label="Net"
              value={<AnimatedMoney value={report.net} />}
              accent={report.net < 0 ? 'danger' : 'success'}
              icon="trending-up"
              hint={
                report.savingsRate == null
                  ? 'Income − expenses'
                  : `${Math.round(report.savingsRate)}% of income saved`
              }
            >
              <Delta current={report.net} previous={report.prev?.net} higherIsGood />
            </StatCard>
          </motion.div>
        </motion.div>
      )}

      {/* Trend + category donut */}
      <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="card flex flex-col p-5">
            <h2 className="mb-4 text-sm font-semibold">Income vs expenses</h2>
            <div className="flex flex-1 items-center">
              {isLoading || !report ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <Suspense fallback={<Skeleton className="h-72 w-full" />}>
                  <TrendAreaChart data={report.trend} />
                </Suspense>
              )}
            </div>
          </div>

          {/* Expense activity heatmap (rolling ~1 year, independent of range) */}
          <div className="card mt-4 p-5">
            {heatmapLoading || !heatmap ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <ExpenseHeatmap data={heatmap} />
            )}
          </div>
        </div>

        <div className="card flex flex-col p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">Where the money went</h2>
          {isLoading || !report ? (
            <Skeleton className="h-56 w-full" />
          ) : report.expenseCategories.length === 0 ? (
            <EmptyState icon="budgets" title="No spending in this range yet" />
          ) : (
            <>
              <Suspense fallback={<Skeleton className="h-56 w-full" />}>
                <CategoryDonut data={report.expenseCategories.slice(0, 8)} />
              </Suspense>
              <ul className="mt-4 space-y-1.5">
                {report.expenseCategories.slice(0, 5).map((c) => (
                  <li key={c.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto shrink-0 tabular-nums text-content-muted">
                      {Math.round(c.pct)}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Full category breakdown */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryTable
          title="Expenses by category"
          empty="No expenses in this range"
          rows={report?.expenseCategories}
          loading={isLoading}
        />
        <CategoryTable
          title="Income by category"
          empty="No income in this range"
          rows={report?.incomeCategories}
          loading={isLoading}
        />
      </div>

      {/* Recent activity */}
      <div className="card mt-4 p-5">
        <h2 className="mb-3 text-sm font-semibold">Recent activity</h2>
        {!overview ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        ) : overview.recent.length === 0 ? (
          <EmptyState icon="expenses" title="Nothing here yet" />
        ) : (
          <ul className="divide-y divide-border">
            {overview.recent.map((t) => (
              <RecentRow key={`${t.kind}-${t.id}`} tx={t} />
            ))}
          </ul>
        )}
      </div>

      <ExpenseFormModal
        open={quickAdd}
        onClose={() => setQuickAdd(false)}
        onSubmit={handleQuickAdd}
        saving={create.isPending}
      />
    </div>
  );
}

function RecentRow({ tx }: { tx: RecentTx }) {
  const isIncome = tx.kind === 'income';
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        {isIncome ? (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-success/10 text-success">
            <Icon name="income" size={16} />
          </span>
        ) : (
          <CategoryBadge color={tx.color} icon={tx.icon} size={36} />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm capitalize">{tx.label}</p>
          <p className="text-xs text-content-muted">{formatDate(tx.date)}</p>
        </div>
      </div>
      <span
        className={cn(
          'shrink-0 text-sm font-semibold tabular-nums',
          isIncome ? 'text-success' : 'text-content',
        )}
      >
        {isIncome ? '+' : '−'}
        {formatMoney(tx.amountBase)}
      </span>
    </li>
  );
}
