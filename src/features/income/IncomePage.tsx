import { useMemo, useState } from "react";
import { PageHeader } from "@/shared/components/PageHeader";
import { Icon } from "@/shared/components/Icon";
import { Skeleton } from "@/shared/components/Skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { useToast } from "@/shared/components/Toast";
import {
  FilterBar,
  EMPTY_FILTERS,
  type CommonFilters,
} from "@/shared/components/FilterBar";
import { formatMoney, formatDate } from "@/shared/lib/format";
import { currencySymbol } from "@/shared/lib/currencies";
import { BASE_CURRENCY } from "@/shared/lib/env";
import { useIncome, useIncomeMutations } from "./hooks";
import { IncomeFormModal } from "./IncomeFormModal";
import {
  type IncomeFilters,
  type IncomeInput,
  type IncomeWithCategory,
} from "./api";
import { useCategories } from "../categories/hooks";
import { CategoryBadge } from "@/shared/components/CategoryBadge";

function toApiFilters(f: CommonFilters, categoryId: string): IncomeFilters {
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

export function IncomePage() {
  const { data: categories } = useCategories();
  const incomeCats = (categories ?? []).filter((c) => c.kind === "income");

  const [filters, setFilters] = useState<CommonFilters>(EMPTY_FILTERS);
  const [categoryId, setCategoryId] = useState("");
  const apiFilters = useMemo(
    () => toApiFilters(filters, categoryId),
    [filters, categoryId],
  );

  const { data: income, isLoading } = useIncome(apiFilters);
  const { create, update, remove } = useIncomeMutations();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeWithCategory | null>(null);

  const total = (income ?? []).reduce(
    (sum, e) => sum + Number(e.amount_base),
    0,
  );

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleSubmit = (input: IncomeInput) => {
    const opts = {
      onSuccess: () => {
        toast.success(editing ? "Income updated" : "Income added");
        setModalOpen(false);
      },
      onError: (e: unknown) =>
        toast.error(e instanceof Error ? e.message : "Save failed"),
    };
    if (editing) update.mutate({ id: editing.id, patch: input }, opts);
    else create.mutate(input, opts);
  };

  const handleDelete = (e: IncomeWithCategory) => {
    if (!confirm("Delete this income entry?")) return;
    remove.mutate(e.id, {
      onSuccess: () => toast.success("Income deleted"),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Delete failed"),
    });
  };

  return (
    <div>
      <PageHeader
        title="Income"
        subtitle={
          income
            ? `${income.length} shown · ${formatMoney(total)} total`
            : "Loading…"
        }
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
          setCategoryId("");
        }}
        facet={
          <select
            className="input w-auto"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-label="Category"
          >
            <option value="">All categories</option>
            {incomeCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
              <CategoryBadge
                color={e.category?.color}
                icon={e.category?.icon}
                size={36}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {e.category?.name ?? "Uncategorised"}
                </p>
                <p className="truncate text-xs text-content-muted">
                  {formatDate(e.occurred_on)}
                  {e.notes ? ` · ${e.notes}` : ""}
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
