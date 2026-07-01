import { useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { CURRENCIES } from '../lib/currencies';

export interface CommonFilters {
  search: string;
  currency: string;
  from: string;
  to: string;
  minAmount: string;
  maxAmount: string;
  sort: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

export const EMPTY_FILTERS: CommonFilters = {
  search: '',
  currency: '',
  from: '',
  to: '',
  minAmount: '',
  maxAmount: '',
  sort: 'date_desc',
};

/**
 * Shared filter/sort toolbar for transaction lists. The entity-specific facet
 * (category for expenses, source for income) is passed in via `facet`.
 */
export function FilterBar({
  filters,
  onChange,
  onReset,
  facet,
}: {
  filters: CommonFilters;
  onChange: (next: CommonFilters) => void;
  onReset: () => void;
  facet?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const set = <K extends keyof CommonFilters>(key: K, value: CommonFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const activeCount =
    (filters.currency ? 1 : 0) +
    (filters.from ? 1 : 0) +
    (filters.to ? 1 : 0) +
    (filters.minAmount ? 1 : 0) +
    (filters.maxAmount ? 1 : 0);

  return (
    <div className="card mb-4 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">
            <Icon name="search" size={16} />
          </span>
          <input
            className="input pl-9"
            placeholder="Search notes…"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
          />
        </div>

        {facet}

        <select
          className="input w-auto"
          value={filters.sort}
          onChange={(e) => set('sort', e.target.value as CommonFilters['sort'])}
          aria-label="Sort"
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="amount_desc">Highest amount</option>
          <option value="amount_asc">Lowest amount</option>
        </select>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="btn-ghost border border-border"
        >
          <Icon name="filter" size={16} />
          Filters{activeCount ? ` (${activeCount})` : ''}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-3 lg:grid-cols-5">
          <label className="text-xs text-content-muted">
            From
            <input
              type="date"
              className="input mt-1"
              value={filters.from}
              onChange={(e) => set('from', e.target.value)}
            />
          </label>
          <label className="text-xs text-content-muted">
            To
            <input
              type="date"
              className="input mt-1"
              value={filters.to}
              onChange={(e) => set('to', e.target.value)}
            />
          </label>
          <label className="text-xs text-content-muted">
            Currency
            <select
              className="input mt-1"
              value={filters.currency}
              onChange={(e) => set('currency', e.target.value)}
            >
              <option value="">Any</option>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-content-muted">
            Min (base)
            <input
              type="number"
              className="input mt-1"
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) => set('minAmount', e.target.value)}
            />
          </label>
          <label className="text-xs text-content-muted">
            Max (base)
            <input
              type="number"
              className="input mt-1"
              placeholder="∞"
              value={filters.maxAmount}
              onChange={(e) => set('maxAmount', e.target.value)}
            />
          </label>
          <div className="col-span-full">
            <button type="button" onClick={onReset} className="btn-ghost text-sm">
              Reset filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
