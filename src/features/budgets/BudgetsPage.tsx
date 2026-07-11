import { useMemo, useState } from 'react';

import { useCategories } from '@/features/categories/hooks';
import { currentMonth, monthLabel, shiftMonth } from '@/features/dashboard/api';
import { CategoryBadge } from '@/shared/components/CategoryBadge';
import { EmptyState } from '@/shared/components/EmptyState';
import { Icon } from '@/shared/components/Icon';
import { PageHeader } from '@/shared/components/PageHeader';
import { Skeleton } from '@/shared/components/Skeleton';
import { StatCard } from '@/shared/components/StatCard';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/lib/cn';
import { currencySymbol } from '@/shared/lib/currencies';
import { BASE_CURRENCY } from '@/shared/lib/env';
import { formatMoney } from '@/shared/lib/format';
import type { CategoryRow } from '@/shared/types/database';
import type { BudgetRow } from '@/shared/types/database';

import { useBudgetMutations, useBudgets, useSpendByCategory } from './hooks';

export function BudgetsPage() {
  const [month, setMonth] = useState(() => currentMonth());
  const toast = useToast();

  const { data: categories } = useCategories();
  const { data: budgets, isLoading: budgetsLoading } = useBudgets(month);
  const { data: spend, isLoading: spendLoading } = useSpendByCategory(month);
  const { upsert, remove, copy } = useBudgetMutations();

  const expenseCats = useMemo(
    () => (categories ?? []).filter((c) => c.kind === 'expense'),
    [categories],
  );
  const budgetByCat = useMemo(() => {
    const map = new Map<string, BudgetRow>();
    for (const b of budgets ?? []) if (b.category_id) map.set(b.category_id, b);
    return map;
  }, [budgets]);

  const isLoading = budgetsLoading || spendLoading || !categories;

  const totals = useMemo(() => {
    let budgeted = 0;
    let spent = 0;
    let overCount = 0;
    for (const c of expenseCats) {
      const b = Number(budgetByCat.get(c.id)?.amount_base ?? 0);
      const s = Number(spend?.[c.id] ?? 0);
      budgeted += b;
      spent += s;
      if (b > 0 && s > b) overCount += 1;
    }
    return { budgeted, spent, overCount };
  }, [expenseCats, budgetByCat, spend]);

  const setBudget = (category: CategoryRow, amount: number | null) => {
    const existing = budgetByCat.get(category.id);
    if (amount == null || amount <= 0) {
      if (!existing) return;
      remove.mutate(existing.id, {
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
      });
      return;
    }
    upsert.mutate(
      { month, input: { category_id: category.id, amount_base: amount } },
      { onError: (e) => toast.error(e instanceof Error ? e.message : 'Save failed') },
    );
  };

  const handleCopyPrevious = () => {
    const from = shiftMonth(month, -1);
    copy.mutate(
      { from, to: month },
      {
        onSuccess: (n) =>
          n > 0
            ? toast.success(
                `Copied ${n} budget${n === 1 ? '' : 's'} from ${monthLabel(from, { month: 'short', year: 'numeric' })}`,
              )
            : toast.toast('No budgets to copy from last month', 'info'),
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Copy failed'),
      },
    );
  };

  const remaining = totals.budgeted - totals.spent;

  return (
    <div>
      <PageHeader
        title="Budgets"
        subtitle="Set a monthly spending limit per category and track how much is left."
        actions={
          <button className="btn-ghost" onClick={handleCopyPrevious} disabled={copy.isPending}>
            <Icon name="duplicate" size={16} />
            Copy last month
          </button>
        }
      />

      <MonthNav month={month} onChange={setMonth} />

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Budgeted"
          value={formatMoney(totals.budgeted)}
          icon="budgets"
          accent="brand"
        />
        <StatCard label="Spent" value={formatMoney(totals.spent)} icon="expenses" />
        <StatCard
          label="Remaining"
          value={formatMoney(remaining)}
          icon="wallet"
          accent={remaining < 0 ? 'danger' : 'success'}
        />
        <StatCard
          label="Over budget"
          value={String(totals.overCount)}
          hint={totals.overCount === 1 ? 'category' : 'categories'}
          icon="activity"
          accent={totals.overCount > 0 ? 'warning' : 'neutral'}
        />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : expenseCats.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="budgets"
              title="No expense categories yet"
              description="Create expense categories first, then set a monthly budget for each."
            />
          </div>
        ) : (
          <div className="card divide-y divide-border overflow-hidden">
            {expenseCats.map((c) => (
              <BudgetRow
                key={c.id}
                category={c}
                budget={Number(budgetByCat.get(c.id)?.amount_base ?? 0)}
                spent={Number(spend?.[c.id] ?? 0)}
                onCommit={(amount) => setBudget(c, amount)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MonthNav({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  const isCurrent = month === currentMonth();
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-2 py-2">
      <button
        className="btn-ghost"
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="Previous month"
      >
        <Icon name="chevron-left" size={18} />
      </button>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{monthLabel(month)}</span>
        {!isCurrent && (
          <button
            className="text-xs text-brand hover:underline"
            onClick={() => onChange(currentMonth())}
          >
            Today
          </button>
        )}
      </div>
      <button
        className="btn-ghost"
        onClick={() => onChange(shiftMonth(month, 1))}
        aria-label="Next month"
      >
        <Icon name="chevron-right" size={18} />
      </button>
    </div>
  );
}

function BudgetRow({
  category,
  budget,
  spent,
  onCommit,
}: {
  category: CategoryRow;
  budget: number;
  spent: number;
  onCommit: (amount: number | null) => void;
}) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const value = editing ? draft : budget > 0 ? String(budget) : '';

  const commit = () => {
    setEditing(false);
    const parsed = parseFloat(draft);
    const next = Number.isNaN(parsed) ? null : parsed;
    // Only write if it actually changed.
    if ((next ?? 0) !== budget) onCommit(next);
  };

  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const over = budget > 0 && spent > budget;
  const remaining = budget - spent;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <CategoryBadge color={category.color} icon={category.icon} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-medium">{category.name}</p>
          <p className="shrink-0 text-xs text-content-muted tabular-nums">
            {formatMoney(spent)}
            {budget > 0 && <> / {formatMoney(budget)}</>}
          </p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              over ? 'bg-danger' : pct > 80 ? 'bg-warning' : 'bg-brand',
            )}
            style={{ width: `${budget > 0 ? pct : 0}%` }}
          />
        </div>
        {budget > 0 && (
          <p className={cn('mt-1 text-xs', over ? 'text-danger' : 'text-content-muted')}>
            {over
              ? `${formatMoney(-remaining)} over budget`
              : `${formatMoney(remaining)} remaining`}
          </p>
        )}
      </div>
      <div className="relative w-32 shrink-0">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-content-muted">
          {currencySymbol(BASE_CURRENCY)}
        </span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          className="input h-9 pl-7 text-right"
          placeholder="0.00"
          value={value}
          onFocus={() => {
            setEditing(true);
            setDraft(budget > 0 ? String(budget) : '');
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              setEditing(false);
              e.currentTarget.blur();
            }
          }}
          aria-label={`Budget for ${category.name}`}
        />
      </div>
    </div>
  );
}
