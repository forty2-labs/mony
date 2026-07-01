import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/shared/components/PageHeader';
import { Icon } from '@/shared/components/Icon';
import { Skeleton } from '@/shared/components/Skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { CategoryBadge } from '@/shared/components/CategoryBadge';
import { useToast } from '@/shared/components/Toast';
import { FilterBar, EMPTY_FILTERS, type CommonFilters } from '@/shared/components/FilterBar';
import { formatMoney, formatDate } from '@/shared/lib/format';
import { currencySymbol } from '@/shared/lib/currencies';
import { BASE_CURRENCY } from '@/shared/lib/env';
import { useCategories } from '@/features/categories/hooks';
import { useExpenses, useExpenseMutations } from './hooks';
import { ExpenseFormModal } from './ExpenseFormModal';
import type { ExpenseFilters, ExpenseInput, ExpenseWithCategory } from './api';

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

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseWithCategory | null>(null);

  const expenseCats = (categories ?? []).filter((c) => c.kind === 'expense');
  const total = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount_base), 0);

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

  const handleDelete = (e: ExpenseWithCategory) => {
    if (!confirm('Delete this expense? It can be recovered from the database (soft delete).'))
      return;
    remove.mutate(e.id, {
      onSuccess: () => toast.success('Expense deleted'),
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Delete failed'),
    });
  };

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={
          expenses ? `${expenses.length} shown · ${formatMoney(total)} total` : 'Loading…'
        }
        actions={
          <button className="btn-primary" onClick={openNew}>
            <Icon name="plus" size={16} />
            Add expense
          </button>
        }
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        onReset={() => {
          setFilters(EMPTY_FILTERS);
          setCategoryId('');
        }}
        facet={
          <select
            className="input w-auto"
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
          </select>
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
            <div key={e.id} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2/50">
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
                <IconBtn name="duplicate" title="Duplicate" onClick={() => handleDuplicate(e)} />
                <IconBtn name="edit" title="Edit" onClick={() => openEdit(e)} />
                <IconBtn name="trash" title="Delete" danger onClick={() => handleDelete(e)} />
              </div>
            </div>
          ))}
        </div>
      )}

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
