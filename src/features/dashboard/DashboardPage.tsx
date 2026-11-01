import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';

import { useAuth } from '@/features/auth/AuthProvider';
import type { ExpenseInput } from '@/features/expenses/api';
import { ExpenseFormModal } from '@/features/expenses/ExpenseFormModal';
import { useExpenseMutations } from '@/features/expenses/hooks';
import { useLoans } from '@/features/loans/hooks';
import { useReport } from '@/features/reports/hooks';
import { Delta, ExportMenu } from '@/features/reports/ReportSections';
import { Icon } from '@/shared/components/Icon';
import { PageHeader } from '@/shared/components/PageHeader';
import { Skeleton } from '@/shared/components/Skeleton';
import { StatCard } from '@/shared/components/StatCard';
import { useToast } from '@/shared/components/Toast';
import { formatMoney, todayISO } from '@/shared/lib/format';

import { CategoryMonthTable } from './CategoryMonthTable';
import { useOverview } from './hooks';
import { RangePicker } from './RangePicker';
import { usePersistedRange } from './usePersistedRange';

// Recharts is heavy — split it into its own chunk loaded on demand.
const TrendAreaChart = lazy(() =>
  import('@/features/reports/ReportCharts').then((m) => ({ default: m.TrendAreaChart })),
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

  const [range, setRange] = usePersistedRange();
  const { data: report, isLoading } = useReport(range);
  const { data: overview } = useOverview();
  const { data: openLoans } = useLoans('open');
  const { create } = useExpenseMutations();
  const toast = useToast();
  const [quickAdd, setQuickAdd] = useState(false);

  const loanSummary = useMemo(() => {
    if (!openLoans) return undefined;
    const today = todayISO();
    return {
      outstanding: openLoans.reduce(
        (a, l) => a + Number(l.amount_base) - Number(l.amount_repaid_base),
        0,
      ),
      count: openLoans.length,
      overdue: openLoans.filter((l) => l.expected_return_date && l.expected_return_date < today)
        .length,
    };
  }, [openLoans]);

  // Money lent out is still yours — it's expected back — so count what's
  // outstanding on open loans towards net worth.
  const netWorth = overview ? overview.balance + (loanSummary?.outstanding ?? 0) : undefined;

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
            <RangePicker value={range} onChange={setRange} />
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

      {/* Stat cards */}
      {isLoading || !report ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        >
          <motion.div variants={CARD_VARIANT} className="h-full">
            <StatCard
              label="Net worth"
              value={netWorth == null ? '—' : <AnimatedMoney value={netWorth} />}
              accent={netWorth != null && netWorth < 0 ? 'danger' : 'brand'}
              icon="wallet"
              hint={
                loanSummary?.outstanding
                  ? `Balance + ${formatMoney(loanSummary.outstanding)} owed to you`
                  : 'All-time income − expenses'
              }
            />
          </motion.div>
          <motion.div variants={CARD_VARIANT} className="h-full">
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
          <motion.div variants={CARD_VARIANT} className="h-full">
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
          <motion.div variants={CARD_VARIANT} className="h-full">
            <StatCard
              label="Net"
              value={<AnimatedMoney value={report.net} />}
              accent={report.net < 0 ? 'danger' : 'success'}
              icon="trending-up"
              tag={
                report.savingsRate == null
                  ? undefined
                  : `${Math.round(report.savingsRate)}% of income saved`
              }
            >
              <Delta current={report.net} previous={report.prev?.net} higherIsGood />
            </StatCard>
          </motion.div>
          <motion.div variants={CARD_VARIANT} className="h-full">
            <StatCard
              label="Loans out"
              value={loanSummary ? <AnimatedMoney value={loanSummary.outstanding} /> : '—'}
              accent={loanSummary?.overdue ? 'warning' : 'neutral'}
              icon="loans"
              hint={
                !loanSummary
                  ? undefined
                  : loanSummary.count === 0
                    ? 'No open loans'
                    : `Owed across ${loanSummary.count} open loan${loanSummary.count === 1 ? '' : 's'}${
                        loanSummary.overdue ? ` · ${loanSummary.overdue} overdue` : ''
                      }`
              }
            />
          </motion.div>
        </motion.div>
      )}

      {/* Trend */}
      <div className="card mt-4 p-5">
        <h2 className="mb-4 text-sm font-semibold">Income vs expenses</h2>
        {isLoading || !report ? (
          <Skeleton className="h-80 w-full" />
        ) : (
          <Suspense fallback={<Skeleton className="h-80 w-full" />}>
            <TrendAreaChart data={report.trend} />
          </Suspense>
        )}
      </div>

      {/* Category × month breakdown */}
      <div className="card mt-4 p-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">By category, per month</h2>
          {report ? (
            <span className="text-xs text-content-muted">
              {report.txCount} {report.txCount === 1 ? 'entry' : 'entries'}
            </span>
          ) : null}
        </div>
        <CategoryMonthTable rows={report?.transactions} range={report?.range} loading={isLoading} />
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
