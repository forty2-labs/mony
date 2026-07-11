import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '@/shared/components/Modal';
import { Icon } from '@/shared/components/Icon';
import { StatCard } from '@/shared/components/StatCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { useCategories } from '@/features/categories/hooks';
import { fetchRateToBase } from '@/features/fx/fxService';
import { CURRENCIES } from '@/shared/lib/currencies';
import { BASE_CURRENCY } from '@/shared/lib/env';
import { formatMoney } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import {
  draftBaseAmount,
  validateDraft,
  type DraftTransaction,
  type ParseOutcome,
  type TxnType,
} from './parsers';
import type { BulkImportPayload } from './api';

type SortKey = 'date' | 'amount';
type TypeFilter = 'all' | 'expense' | 'income';

const cellClass =
  'w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs text-content outline-none transition focus:border-brand focus:ring-1 focus:ring-brand/30';

export function ImportReviewModal({
  open,
  outcome,
  onClose,
  onConfirm,
  importing,
}: {
  open: boolean;
  outcome: ParseOutcome | null;
  onClose: () => void;
  onConfirm: (payload: BulkImportPayload) => void;
  importing?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={outcome ? `Review import · ${outcome.parserLabel}` : 'Review import'}
      widthClass="max-w-6xl"
    >
      {outcome && (
        <ReviewTable
          key={outcome.transactions[0]?.rowId ?? 'empty'}
          outcome={outcome}
          onCancel={onClose}
          onConfirm={onConfirm}
          importing={importing}
        />
      )}
    </Modal>
  );
}

function ReviewTable({
  outcome,
  onCancel,
  onConfirm,
  importing,
}: {
  outcome: ParseOutcome;
  onCancel: () => void;
  onConfirm: (payload: BulkImportPayload) => void;
  importing?: boolean;
}) {
  const { data: categories } = useCategories();
  const [rows, setRows] = useState<DraftTransaction[]>(() => outcome.transactions);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const patch = (rowId: string, next: Partial<DraftTransaction>) =>
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...next } : r)));

  // Auto-map the statement's own category text to an existing category (once
  // categories have loaded), matching on kind + name, case-insensitive.
  const mappedRef = useRef(false);
  useEffect(() => {
    if (mappedRef.current || !categories?.length) return;
    mappedRef.current = true;
    setRows((prev) =>
      prev.map((r) => {
        if (r.categoryId || !r.suggestedCategory) return r;
        const match = categories.find(
          (c) =>
            c.kind === r.type &&
            c.name.toLowerCase() === r.suggestedCategory!.toLowerCase(),
        );
        return match ? { ...r, categoryId: match.id } : r;
      }),
    );
  }, [categories]);

  // Best-effort FX: fetch the as-of rate for each distinct foreign
  // currency+date so base amounts are correct. Never blocks or throws.
  const fxRef = useRef(false);
  useEffect(() => {
    if (fxRef.current) return;
    fxRef.current = true;
    const targets = new Map<string, { currency: string; date: string }>();
    for (const r of outcome.transactions) {
      if (r.currencyOriginal !== BASE_CURRENCY && r.exchangeRate === 1 && r.occurredOn) {
        targets.set(`${r.currencyOriginal}|${r.occurredOn}`, {
          currency: r.currencyOriginal,
          date: r.occurredOn,
        });
      }
    }
    if (targets.size === 0) return;
    let cancelled = false;
    void (async () => {
      for (const { currency, date } of targets.values()) {
        const result = await fetchRateToBase(currency, date);
        if (cancelled || !result) continue;
        setRows((prev) =>
          prev.map((r) =>
            r.currencyOriginal === currency &&
            r.occurredOn === date &&
            r.exchangeRate === 1
              ? { ...r, exchangeRate: result.rate }
              : r,
          ),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [outcome]);

  const validations = useMemo(() => {
    const map = new Map<string, ReturnType<typeof validateDraft>>();
    for (const r of rows) map.set(r.rowId, validateDraft(r));
    return map;
  }, [rows]);

  const displayed = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (attentionOnly && validations.get(r.rowId)?.valid && r.notes.length === 0)
        return false;
      if (q) {
        const cat = categories?.find((c) => c.id === r.categoryId)?.name ?? '';
        const hay = `${r.description} ${cat} ${r.currencyOriginal}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const dir = sortAsc ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === 'amount') {
        return ((draftBaseAmount(a) || 0) - (draftBaseAmount(b) || 0)) * dir;
      }
      return a.occurredOn.localeCompare(b.occurredOn) * dir;
    });
  }, [rows, query, typeFilter, attentionOnly, sortKey, sortAsc, validations, categories]);

  const summary = useMemo(() => {
    const selectedValid = rows.filter(
      (r) => r.selected && validations.get(r.rowId)?.valid,
    );
    const expenses = selectedValid.filter((r) => r.type === 'expense');
    const income = selectedValid.filter((r) => r.type === 'income');
    const sum = (list: DraftTransaction[]) =>
      list.reduce((acc, r) => acc + (draftBaseAmount(r) || 0), 0);
    const invalidSelected = rows.filter(
      (r) => r.selected && !validations.get(r.rowId)?.valid,
    ).length;
    return {
      expensesCount: expenses.length,
      incomeCount: income.length,
      expensesTotal: sum(expenses),
      incomeTotal: sum(income),
      importable: selectedValid.length,
      invalidSelected,
    };
  }, [rows, validations]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key === 'amount' ? false : false);
    }
  };

  const setSelectionForDisplayed = (selected: boolean) => {
    const ids = new Set(displayed.map((r) => r.rowId));
    setRows((prev) => prev.map((r) => (ids.has(r.rowId) ? { ...r, selected } : r)));
  };

  const allDisplayedSelected =
    displayed.length > 0 && displayed.every((r) => r.selected);
  const someDisplayedSelected = displayed.some((r) => r.selected);
  const headerCheckRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate =
        someDisplayedSelected && !allDisplayedSelected;
    }
  }, [someDisplayedSelected, allDisplayedSelected]);

  const changeType = (row: DraftTransaction, type: TxnType) => {
    // Category lists differ by kind, so drop the assignment on switch.
    patch(row.rowId, { type, categoryId: null });
  };

  const changeCurrency = (row: DraftTransaction, currency: string) => {
    patch(row.rowId, {
      currencyOriginal: currency,
      exchangeRate: currency === BASE_CURRENCY ? 1 : row.exchangeRate,
    });
  };

  const confirm = () => {
    const payload: BulkImportPayload = { expenses: [], income: [] };
    for (const r of rows) {
      if (!r.selected || !validations.get(r.rowId)?.valid) continue;
      const common = {
        category_id: r.categoryId,
        amount_original: r.amountOriginal,
        currency_original: r.currencyOriginal,
        exchange_rate: r.exchangeRate,
        amount_base: draftBaseAmount(r),
        occurred_on: r.occurredOn,
        notes: r.description.trim() || null,
      };
      if (r.type === 'expense') payload.expenses.push(common);
      else payload.income.push(common);
    }
    onConfirm(payload);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="To import"
          value={summary.importable}
          hint={`${rows.length} parsed${outcome.skipped ? ` · ${outcome.skipped} empty skipped` : ''}`}
          accent="brand"
          icon="import"
        />
        <StatCard
          label="Expenses"
          value={summary.expensesCount}
          hint={formatMoney(summary.expensesTotal)}
          accent="danger"
          icon="expenses"
        />
        <StatCard
          label="Income"
          value={summary.incomeCount}
          hint={formatMoney(summary.incomeTotal)}
          accent="success"
          icon="income"
        />
        <StatCard
          label="Needs attention"
          value={summary.invalidSelected}
          hint={summary.invalidSelected ? 'Selected rows with errors' : 'All clear'}
          accent={summary.invalidSelected ? 'warning' : 'neutral'}
          icon="alert"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">
            <Icon name="search" size={16} />
          </span>
          <input
            className="input pl-9"
            placeholder="Search description, category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          aria-label="Filter by type"
        >
          <option value="all">All types</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </select>
        <button
          type="button"
          onClick={() => setAttentionOnly((v) => !v)}
          className={cn(
            'btn-ghost border border-border',
            attentionOnly && 'border-warning/50 text-warning',
          )}
        >
          <Icon name="alert" size={16} />
          Attention
        </button>
        <div className="ml-auto flex items-center gap-1 text-sm">
          <button
            type="button"
            className="btn-ghost text-xs"
            onClick={() => setSelectionForDisplayed(true)}
          >
            Select all
          </button>
          <button
            type="button"
            className="btn-ghost text-xs"
            onClick={() => setSelectionForDisplayed(false)}
          >
            Deselect all
          </button>
        </div>
      </div>

      {/* Table */}
      {displayed.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="search"
            title="No matching rows"
            description="Adjust the search or filters to see parsed transactions."
          />
        </div>
      ) : (
        <div className="max-h-[52vh] overflow-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-surface-2 text-content-muted">
              <tr>
                <th className="w-8 px-2 py-2">
                  <input
                    ref={headerCheckRef}
                    type="checkbox"
                    checked={allDisplayedSelected}
                    onChange={(e) => setSelectionForDisplayed(e.target.checked)}
                    aria-label="Select all shown"
                  />
                </th>
                <th className="px-2 py-2 font-medium">Type</th>
                <th className="px-2 py-2 font-medium">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => toggleSort('date')}
                  >
                    Date {sortKey === 'date' ? (sortAsc ? '↑' : '↓') : ''}
                  </button>
                </th>
                <th className="min-w-[200px] px-2 py-2 font-medium">Description</th>
                <th className="min-w-[140px] px-2 py-2 font-medium">Category</th>
                <th className="px-2 py-2 text-right font-medium">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => toggleSort('amount')}
                  >
                    Amount {sortKey === 'amount' ? (sortAsc ? '↑' : '↓') : ''}
                  </button>
                </th>
                <th className="px-2 py-2 text-right font-medium">Base</th>
                <th className="w-8 px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayed.map((row) => {
                const v = validations.get(row.rowId)!;
                const base = draftBaseAmount(row);
                const cats = (categories ?? []).filter((c) => c.kind === row.type);
                const foreign = row.currencyOriginal !== BASE_CURRENCY;
                const attention = !v.valid || row.notes.length > 0;
                return (
                  <tr
                    key={row.rowId}
                    className={cn(
                      'align-top',
                      !v.valid && 'bg-danger/5',
                      v.valid && row.notes.length > 0 && 'bg-warning/5',
                    )}
                  >
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(e) => patch(row.rowId, { selected: e.target.checked })}
                        aria-label="Select row"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        className={cn(
                          cellClass,
                          'w-24 font-medium',
                          row.type === 'expense' ? 'text-danger' : 'text-success',
                        )}
                        value={row.type}
                        onChange={(e) => changeType(row, e.target.value as TxnType)}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="date"
                        className={cn(cellClass, 'w-36')}
                        value={row.occurredOn}
                        onChange={(e) => patch(row.rowId, { occurredOn: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className={cellClass}
                        value={row.description}
                        onChange={(e) =>
                          patch(row.rowId, { description: e.target.value })
                        }
                        placeholder="Description"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        className={cellClass}
                        value={row.categoryId ?? ''}
                        onChange={(e) =>
                          patch(row.rowId, { categoryId: e.target.value || null })
                        }
                      >
                        <option value="">Uncategorised</option>
                        {cats.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          step="0.01"
                          className={cn(cellClass, 'w-20 text-right tabular-nums')}
                          value={Number.isNaN(row.amountOriginal) ? '' : row.amountOriginal}
                          onChange={(e) =>
                            patch(row.rowId, {
                              amountOriginal:
                                e.target.value === ''
                                  ? NaN
                                  : Number.parseFloat(e.target.value),
                            })
                          }
                        />
                        <select
                          className={cn(cellClass, 'w-20')}
                          value={row.currencyOriginal}
                          onChange={(e) => changeCurrency(row, e.target.value)}
                          aria-label="Currency"
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                      </div>
                      {foreign && (
                        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-content-muted">
                          <span>rate</span>
                          <input
                            type="number"
                            step="0.00000001"
                            className={cn(cellClass, 'w-24 text-right tabular-nums')}
                            value={Number.isNaN(row.exchangeRate) ? '' : row.exchangeRate}
                            onChange={(e) =>
                              patch(row.rowId, {
                                exchangeRate:
                                  e.target.value === ''
                                    ? NaN
                                    : Number.parseFloat(e.target.value),
                              })
                            }
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {attention && (
                          <span
                            className={cn(!v.valid ? 'text-danger' : 'text-warning')}
                            title={[...v.errors, ...row.notes].join(' · ')}
                          >
                            <Icon name="alert" size={14} />
                          </span>
                        )}
                        <span className="font-semibold tabular-nums">
                          {Number.isNaN(base) ? '—' : formatMoney(base)}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          setRows((prev) => prev.filter((r) => r.rowId !== row.rowId))
                        }
                        title="Remove row"
                        className="rounded-lg p-1 text-content-muted transition hover:bg-surface-2 hover:text-danger"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p className="text-xs text-content-muted">
          {summary.invalidSelected > 0
            ? `${summary.invalidSelected} selected row(s) have errors and will be skipped.`
            : 'Only selected, valid rows are imported.'}
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={confirm}
            disabled={importing || summary.importable === 0}
          >
            {importing
              ? 'Importing…'
              : `Import ${summary.importable} transaction${summary.importable === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
