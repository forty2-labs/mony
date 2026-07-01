import { useMemo, useState } from 'react';
import { PageHeader } from '@/shared/components/PageHeader';
import { Icon } from '@/shared/components/Icon';
import { Skeleton } from '@/shared/components/Skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { useToast } from '@/shared/components/Toast';
import { FilterBar, EMPTY_FILTERS, type CommonFilters } from '@/shared/components/FilterBar';
import { formatMoney, formatDate } from '@/shared/lib/format';
import { currencySymbol } from '@/shared/lib/currencies';
import { BASE_CURRENCY } from '@/shared/lib/env';
import type { IncomeRow, IncomeSource } from '@/shared/types/database';
import { useIncome, useIncomeMutations } from './hooks';
import { IncomeFormModal } from './IncomeFormModal';
import { INCOME_SOURCES, type IncomeFilters, type IncomeInput } from './api';

function toApiFilters(f: CommonFilters, source: string): IncomeFilters {
  return {
    search: f.search || undefined,
    source: (source || null) as IncomeSource | null,
    currency: f.currency || null,
    from: f.from || null,
    to: f.to || null,
    minAmount: f.minAmount ? Number(f.minAmount) : null,
    maxAmount: f.maxAmount ? Number(f.maxAmount) : null,
    sort: f.sort,
  };
}

const SOURCE_LABEL: Record<IncomeSource, string> = Object.fromEntries(
  INCOME_SOURCES.map((s) => [s.value, s.label]),
) as Record<IncomeSource, string>;

export function IncomePage() {
  const [filters, setFilters] = useState<CommonFilters>(EMPTY_FILTERS);
  const [source, setSource] = useState('');
  const apiFilters = useMemo(() => toApiFilters(filters, source), [filters, source]);

  const { data: income, isLoading } = useIncome(apiFilters);
  const { create, update, remove } = useIncomeMutations();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeRow | null>(null);

  const total = (income ?? []).reduce((sum, e) => sum + Number(e.amount_base), 0);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleSubmit = (input: IncomeInput) => {
    const opts = {
      onSuccess: () => {
        toast.success(editing ? 'Income updated' : 'Income added');
        setModalOpen(false);
      },
      onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Save failed'),
    };
    if (editing) update.mutate({ id: editing.id, patch: input }, opts);
    else create.mutate(input, opts);
  };

  const handleDelete = (e: IncomeRow) => {
    if (!confirm('Delete this income entry?')) return;
    remove.mutate(e.id, {
      onSuccess: () => toast.success('Income deleted'),
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Delete failed'),
    });
  };

  return (
    <div>
      <PageHeader
        title="Income"
        subtitle={income ? `${income.length} shown · ${formatMoney(total)} total` : 'Loading…'}
        actions={
          <button className="btn-primary" onClick={openNew}>
            <Icon name="plus" size={16} />
            Add income
          </button>
        }
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        onReset={() => {
          setFilters(EMPTY_FILTERS);
          setSource('');
        }}
        facet={
          <select
            className="input w-auto"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            aria-label="Source"
          >
            <option value="">All sources</option>
            {INCOME_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : !income || income.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="income"
            title="No income recorded"
            description="Track salary, freelance work, investments and more."
            action={
              <button className="btn-primary" onClick={openNew}>
                <Icon name="plus" size={16} />
                Add income
              </button>
            }
          />
        </div>
      ) : (
        <div className="card divide-y divide-border overflow-hidden">
          {income.map((e) => (
            <div key={e.id} className="group flex items-center gap-3 px-4 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-success/10 text-success">
                <Icon name="income" size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{SOURCE_LABEL[e.source]}</p>
                <p className="truncate text-xs text-content-muted">
                  {formatDate(e.occurred_on)}
                  {e.notes ? ` · ${e.notes}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-success">
                  +{formatMoney(Number(e.amount_base))}
                </p>
                {e.currency_original !== BASE_CURRENCY && (
                  <p className="text-xs text-content-muted tabular-nums">
                    {currencySymbol(e.currency_original)}
                    {Number(e.amount_original).toFixed(2)} {e.currency_original}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => {
                    setEditing(e);
                    setModalOpen(true);
                  }}
                  title="Edit"
                  className="rounded-lg p-1.5 text-content-muted hover:bg-surface-2 hover:text-content"
                >
                  <Icon name="edit" size={16} />
                </button>
                <button
                  onClick={() => handleDelete(e)}
                  title="Delete"
                  className="rounded-lg p-1.5 text-content-muted hover:bg-surface-2 hover:text-danger"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <IncomeFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        saving={create.isPending || update.isPending}
      />
    </div>
  );
}
