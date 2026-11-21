import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useCategories } from '@/features/categories/hooks';
import { CategoryBadge } from '@/shared/components/CategoryBadge';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { EmptyState } from '@/shared/components/EmptyState';
import { type CommonFilters, EMPTY_FILTERS, FilterBar } from '@/shared/components/FilterBar';
import { Icon } from '@/shared/components/Icon';
import { PageHeader } from '@/shared/components/PageHeader';
import { Select } from '@/shared/components/Select';
import { Skeleton } from '@/shared/components/Skeleton';
import { useToast } from '@/shared/components/Toast';
import { currencySymbol } from '@/shared/lib/currencies';
import { BASE_CURRENCY } from '@/shared/lib/env';
import { formatDate, formatMoney } from '@/shared/lib/format';

import type { ExpenseFilters, ExpenseInput, ExpenseWithCategory } from './api';
import { ExpenseForm } from './ExpenseForm';
import { ExpenseFormModal } from './ExpenseFormModal';
import { useExpenseMutations, useExpenses } from './hooks';

type CategorySummary = {
  key: string;
  name: string;
  color: string | null;
  icon: string | null;
  total: number;
};

function summarizeByCategory(expenses: ExpenseWithCategory[]): CategorySummary[] {
  const map = new Map<string, CategorySummary>();
  for (const e of expenses) {
    const key = e.category_id ?? '__uncategorised';
    const existing = map.get(key);
    if (existing) {
      existing.total += Number(e.amount_base);
    } else {
      map.set(key, {
        key,
        name: e.category?.name ?? 'Uncategorised',
        color: e.category?.color ?? null,
        icon: e.category?.icon ?? null,
        total: Number(e.amount_base),
      });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function toApiFilters(f: CommonFilters, categoryId: string): ExpenseFilters {
  return {
    search: f.search || undefined,
    categoryId: categoryId || null,
    currency: f.currency || null,
    from: f.from || null,
    to: f.to || null,
    minAmount: f.minAmount ? Number(f.minAmount) : null,
    maxAmount: f.maxAmount ? Number(f.maxAmount) : null,
    sort: f.sort,
  };
}

export function ExpensesPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<CommonFilters>(() => ({
    ...EMPTY_FILTERS,
    search: searchParams.get('q') ?? '',
  }));
  const [categoryId, setCategoryId] = useState('');
  const apiFilters = useMemo(() => toApiFilters(filters, categoryId), [filters, categoryId]);

  // Keep the search box in sync when arriving via the global topbar search.
  const q = searchParams.get('q') ?? '';
  useEffect(() => {
    setFilters((f) => (f.search === q ? f : { ...f, search: q }));
  }, [q]);

  const { data: expenses, isLoading } = useExpenses(apiFilters);
  const { data: categories } = useCategories();
  const { create, update, remove } = useExpenseMutations();
  const toast = useToast();
  const confirm = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseWithCategory | null>(null);
  // Bumped after a successful inline add to remount (and thus reset) the form.
  const [addFormKey, setAddFormKey] = useState(0);

  const expenseCats = (categories ?? []).filter((c) => c.kind === 'expense');
  const total = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount_base), 0);
  const byCategory = useMemo(() => summarizeByCategory(expenses ?? []), [expenses]);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (e: ExpenseWithCategory) => {
    setEditing(e);
    setModalOpen(true);
  };

  const handleSubmit = (input: ExpenseInput) => {
    const opts = {
      onSuccess: () => {
        toast.success(editing ? 'Expense updated' : 'Expense added');
        setModalOpen(false);
      },
      onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Save failed'),
    };
    if (editing) update.mutate({ id: editing.id, patch: input }, opts);
    else create.mutate(input, opts);
  };

  const handleInlineAdd = (input: ExpenseInput) => {
    create.mutate(input, {
      onSuccess: () => {
        toast.success('Expense added');
        setAddFormKey((k) => k + 1); // reset the inline form for the next entry
      },
      onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Save failed'),
    });
  };

  const handleDuplicate = (e: ExpenseWithCategory) => {
    create.mutate(
      {
        category_id: e.category_id,
        amount_original: Number(e.amount_original),
        currency_original: e.currency_original,
        exchange_rate: Number(e.exchange_rate),
        amount_base: Number(e.amount_base),
        occurred_on: e.occurred_on,
        notes: e.notes,
      },
      {
        onSuccess: () => toast.success('Expense duplicated'),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed'),
      },
    );
  };

  const handleDelete = async (e: ExpenseWithCategory) => {
    const ok = await confirm({
      title: 'Delete this expense?',
      message: 'It will be removed from your lists and totals.',
    });
    if (!ok) return;
    remove.mutate(e.id, {
      onSuccess: () => toast.success('Expense deleted'),
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Delete failed'),
    });
  };

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={expenses ? `${expenses.length} shown · ${formatMoney(total)} total` : 'Loading…'}
        actions={
          <button className="btn-primary" onClick={openNew}>
            <Icon name="plus" size={16} />
            Add expense
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            onReset={() => {
              setFilters(EMPTY_FILTERS);
              setCategoryId('');
            }}
            facet={
              <Select
                className="w-auto"
                wrapperClassName="w-auto"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                aria-label="Category"
              >
                <option value="">All categories</option>
                {expenseCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            }
          />

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : !expenses || expenses.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="expenses"
                title="No expenses yet"
                description="Add your first expense to start tracking your spending."
                action={
                  <button className="btn-primary" onClick={openNew}>
                    <Icon name="plus" size={16} />
                    Add expense
                  </button>
                }
              />
            </div>
          ) : (
            <div className="card divide-y divide-border overflow-hidden">
              {expenses.map((e) => (
                <div
                  key={e.id}
                  className="group flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2/50"
                >
                  <CategoryBadge color={e.category?.color} icon={e.category?.icon} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {e.category?.name ?? 'Uncategorised'}
                    </p>
                    <p className="truncate text-xs text-content-muted">
                      {formatDate(e.occurred_on)}
                      {e.notes ? ` · ${e.notes}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatMoney(Number(e.amount_base))}
                    </p>
                    {e.currency_original !== BASE_CURRENCY && (
                      <p className="text-xs text-content-muted tabular-nums">
                        {currencySymbol(e.currency_original)}
                        {Number(e.amount_original).toFixed(2)} {e.currency_original}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                    <IconBtn
                      name="duplicate"
                      title="Duplicate"
                      onClick={() => handleDuplicate(e)}
                    />
                    <IconBtn name="edit" title="Edit" onClick={() => openEdit(e)} />
                    <IconBtn name="trash" title="Delete" danger onClick={() => handleDelete(e)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="space-y-6 lg:sticky lg:top-8">
            <div className="card p-4">
              <h2 className="mb-4 text-sm font-semibold">Add expense</h2>
              <ExpenseForm key={addFormKey} onSubmit={handleInlineAdd} saving={create.isPending} />
            </div>

            <div className="card p-4 pr-5">
              {byCategory.length === 0 ? (
                <p className="text-sm text-content-muted">No expenses match the current filters.</p>
              ) : (
                <ul className="space-y-3">
                  {byCategory.map((c) => {
                    const pct = total > 0 ? (c.total / total) * 100 : 0;
                    return (
                      <li key={c.key} className="flex items-center gap-3">
                        <CategoryBadge color={c.color} icon={c.icon} size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-medium">{c.name}</span>
                            <span className="text-sm font-semibold tabular-nums">
                              {formatMoney(c.total)}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: `${c.color}` }}
                            />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>

      <ExpenseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        saving={create.isPending || update.isPending}
      />
    </div>
  );
}

function IconBtn({
  name,
  title,
  onClick,
  danger,
}: {
  name: 'duplicate' | 'edit' | 'trash';
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-lg p-1.5 text-content-muted hover:bg-surface-2 ${
        danger ? 'hover:text-danger' : 'hover:text-content'
      }`}
    >
      <Icon name={name} size={16} />
    </button>
  );
}
