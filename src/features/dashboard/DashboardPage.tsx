import { lazy, Suspense, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import type { ExpenseInput } from '@/features/expenses/api';
import { ExpenseFormModal } from '@/features/expenses/ExpenseFormModal';
import { useExpenseMutations } from '@/features/expenses/hooks';
import { CategoryBadge } from '@/shared/components/CategoryBadge';
import { EmptyState } from '@/shared/components/EmptyState';
import { Icon } from '@/shared/components/Icon';
import { PageHeader } from '@/shared/components/PageHeader';
import { Skeleton } from '@/shared/components/Skeleton';
import { StatCard } from '@/shared/components/StatCard';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/lib/cn';
import { formatDate, formatMoney } from '@/shared/lib/format';

import { type CategorySlice, currentMonth, monthLabel, type RecentTx, shiftMonth } from './api';
import { useDashboard } from './hooks';

// Recharts is heavy — split it into its own chunk loaded on demand.
const TrendChart = lazy(() => import('./DashboardCharts').then((m) => ({ default: m.TrendChart })));

export function DashboardPage() {
  const { user } = useAuth();
  const name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'there';

  const [month, setMonth] = useState(currentMonth());
  const { data, isLoading } = useDashboard(month);
  const { create } = useExpenseMutations();
  const toast = useToast();
  const [quickAdd, setQuickAdd] = useState(false);
  const isCurrent = month === currentMonth();

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
        title={`Good to see you, ${name}`}
        subtitle="Your financial overview at a glance."
        actions={
          <button className="btn-primary" onClick={() => setQuickAdd(true)}>
            <Icon name="plus" size={16} />
            Quick add
          </button>
        }
      />

      {/* Month switcher */}
      <div className="mb-4 flex items-center gap-2">
        <div className="inline-flex items-center rounded-xl border border-border bg-surface p-1 shadow-soft">
          <button
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="rounded-lg p-1.5 text-content-muted transition hover:bg-surface-2 hover:text-content"
            aria-label="Previous month"
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <span className="min-w-[9.5rem] text-center text-sm font-medium">
            {monthLabel(month)}
          </span>
          <button
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            disabled={isCurrent}
            className="rounded-lg p-1.5 text-content-muted transition enabled:hover:bg-surface-2 enabled:hover:text-content disabled:opacity-40"
            aria-label="Next month"
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
        {!isCurrent && (
          <button onClick={() => setMonth(currentMonth())} className="btn-ghost h-9 text-sm">
            This month
          </button>
        )}
      </div>

      {/* Stat cards */}
      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Balance"
            value={formatMoney(data.balance)}
            accent={data.balance < 0 ? 'danger' : 'brand'}
            icon="wallet"
            hint="All-time income − expenses"
          />
          <StatCard
            label="Income"
            value={formatMoney(data.monthIncome)}
            accent="success"
            icon="income"
            hint={monthLabel(month, { month: 'long' })}
          />
          <StatCard
            label="Expenses"
            value={formatMoney(data.monthExpenses)}
            accent="danger"
            icon="expenses"
            hint={monthLabel(month, { month: 'long' })}
          />
          <StatCard
            label="Net saved"
            value={formatMoney(data.netThisMonth)}
            accent={data.netThisMonth < 0 ? 'danger' : 'success'}
            icon="trending-up"
            hint="Income − expenses"
          />
        </div>
      )}

      {/* Charts */}
      <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
        <div className="card flex flex-col p-5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold">Income vs expenses · last 6 months</h2>
          <div className="flex flex-1 items-center">
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <TrendChart data={data.trend} />
              </Suspense>
            )}
          </div>
        </div>

        <div className="card flex flex-col p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">
            Spending by category · {monthLabel(month, { month: 'long' })}
          </h2>
          <div className="flex flex-1 items-center">
            {isLoading || !data ? (
              <div className="w-full space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : (
              <CategoryBars data={data.categoryBreakdown} />
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-4 card p-5">
        <h2 className="mb-3 text-sm font-semibold">Recent activity</h2>
        {isLoading || !data ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        ) : data.recent.length === 0 ? (
          <EmptyState icon="expenses" title="Nothing here yet" />
        ) : (
          <ul className="divide-y divide-border">
            {data.recent.map((t) => (
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

/**
 * Ranked horizontal bars for the month's category spending. Bar width is
 * relative to the largest category; percentages are of the total. The long tail
 * beyond the top rows is folded into a single "Other categories" bar.
 */
function CategoryBars({ data }: { data: CategorySlice[] }) {
  if (data.length === 0) {
    return <EmptyState icon="budgets" title="No spending this month yet" />;
  }

  const MAX_ROWS = 7;
  const rows: CategorySlice[] =
    data.length > MAX_ROWS
      ? [
          ...data.slice(0, MAX_ROWS - 1),
          {
            name: 'Other categories',
            color: '#9aa0aa',
            icon: null,
            total: data.slice(MAX_ROWS - 1).reduce((a, s) => a + s.total, 0),
          },
        ]
      : data;

  const total = data.reduce((a, s) => a + s.total, 0);
  const max = Math.max(...rows.map((r) => r.total), 1);

  return (
    <ul className="w-full space-y-3.5">
      {rows.map((s) => {
        const pct = total ? Math.round((s.total / total) * 100) : 0;
        return (
          <li key={s.name}>
            <div className="mb-1.5 flex items-center gap-2 text-sm">
              <CategoryBadge color={s.color} icon={s.icon} size={22} />
              <span className="truncate">{s.name}</span>
              <span className="ml-auto shrink-0 font-medium tabular-nums">
                {formatMoney(s.total)}
              </span>
              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-content-muted">
                {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(s.total / max) * 100}%`, backgroundColor: s.color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
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
