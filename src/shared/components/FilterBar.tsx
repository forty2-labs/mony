import { type ReactNode, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '../lib/cn';
import { CURRENCIES, currencySymbol } from '../lib/currencies';
import { BASE_CURRENCY } from '../lib/env';
import { formatDate, todayISO } from '../lib/format';
import { DateField } from './DateField';
import { Icon } from './Icon';
import { Select } from './Select';

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

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function iso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function addDays(base: string, delta: number) {
  const [y, m, d] = base.split('-').map(Number);
  return iso(new Date(y, m - 1, d + delta));
}

/** Quick date-range presets. `range()` is evaluated lazily against "today". */
const RANGE_PRESETS: { key: string; label: string; range: () => { from: string; to: string } }[] = [
  {
    key: 'this_month',
    label: 'This month',
    range: () => {
      const now = new Date();
      return {
        from: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    },
  },
  {
    key: 'last_30',
    label: 'Last 30 days',
    range: () => ({ from: addDays(todayISO(), -29), to: todayISO() }),
  },
  {
    key: 'last_90',
    label: 'Last 90 days',
    range: () => ({ from: addDays(todayISO(), -89), to: todayISO() }),
  },
  {
    key: 'this_year',
    label: 'This year',
    range: () => {
      const y = new Date().getFullYear();
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    },
  },
];

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

  const setRange = (from: string, to: string) => onChange({ ...filters, from, to });

  const activeCount =
    (filters.currency ? 1 : 0) +
    (filters.from || filters.to ? 1 : 0) +
    (filters.minAmount ? 1 : 0) +
    (filters.maxAmount ? 1 : 0);

  const sym = currencySymbol(BASE_CURRENCY);

  // Which quick-range preset (if any) matches the current from/to exactly.
  const activePreset = RANGE_PRESETS.find((p) => {
    const r = p.range();
    return filters.from === r.from && filters.to === r.to;
  })?.key;

  // Active-filter chips (excludes search/sort, which are always visible above).
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.from || filters.to) {
    const label =
      filters.from && filters.to
        ? `${formatDate(filters.from)} – ${formatDate(filters.to)}`
        : filters.from
          ? `From ${formatDate(filters.from)}`
          : `Until ${formatDate(filters.to)}`;
    chips.push({ key: 'date', label, clear: () => setRange('', '') });
  }
  if (filters.currency)
    chips.push({ key: 'currency', label: filters.currency, clear: () => set('currency', '') });
  if (filters.minAmount)
    chips.push({
      key: 'min',
      label: `≥ ${sym}${filters.minAmount}`,
      clear: () => set('minAmount', ''),
    });
  if (filters.maxAmount)
    chips.push({
      key: 'max',
      label: `≤ ${sym}${filters.maxAmount}`,
      clear: () => set('maxAmount', ''),
    });

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

        <Select
          className="w-auto"
          wrapperClassName="w-auto"
          value={filters.sort}
          onChange={(v) => set('sort', v as CommonFilters['sort'])}
          aria-label="Sort"
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="amount_desc">Highest amount</option>
          <option value="amount_asc">Lowest amount</option>
        </Select>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            'btn-ghost border transition',
            expanded || activeCount ? 'border-brand text-brand' : 'border-border',
          )}
        >
          <Icon name="filter" size={16} />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-brand px-1 text-xs font-semibold text-brand-fg">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 py-1 pl-2.5 pr-1 text-xs font-medium"
            >
              {chip.label}
              <button
                type="button"
                aria-label={`Clear ${chip.key} filter`}
                onClick={chip.clear}
                className="grid h-4 w-4 place-items-center rounded-full text-content-muted transition hover:bg-border hover:text-content"
              >
                <Icon name="close" size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onReset}
            className="ml-1 text-xs font-medium text-content-muted transition hover:text-content"
          >
            Clear all
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="filter-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 border-t border-border pt-3">
              <div>
                <p className="mb-1.5 text-xs font-medium text-content-muted">Quick ranges</p>
                <div className="flex flex-wrap gap-1.5">
                  {RANGE_PRESETS.map((p) => {
                    const active = activePreset === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          const r = p.range();
                          if (active) setRange('', '');
                          else setRange(r.from, r.to);
                        }}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition',
                          active
                            ? 'border-brand bg-brand text-brand-fg'
                            : 'border-border text-content-muted hover:border-brand hover:text-content',
                        )}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <label className="text-xs text-content-muted">
                  From
                  <DateField
                    value={filters.from}
                    onChange={(v) => set('from', v)}
                    max={filters.to || todayISO()}
                    placeholder="Any"
                    clearable
                    presets={false}
                    className="mt-1"
                  />
                </label>
                <label className="text-xs text-content-muted">
                  To
                  <DateField
                    value={filters.to}
                    onChange={(v) => set('to', v)}
                    min={filters.from || undefined}
                    max={todayISO()}
                    placeholder="Any"
                    clearable
                    presets={false}
                    className="mt-1"
                  />
                </label>
                <label className="text-xs text-content-muted">
                  Currency
                  <Select
                    wrapperClassName="mt-1"
                    value={filters.currency}
                    onChange={(v) => set('currency', v)}
                  >
                    <option value="">Any</option>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="text-xs text-content-muted">
                  Min ({BASE_CURRENCY})
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">
                      {sym}
                    </span>
                    <input
                      type="number"
                      className="input pl-7"
                      placeholder="0"
                      value={filters.minAmount}
                      onChange={(e) => set('minAmount', e.target.value)}
                    />
                  </div>
                </label>
                <label className="text-xs text-content-muted">
                  Max ({BASE_CURRENCY})
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">
                      {sym}
                    </span>
                    <input
                      type="number"
                      className="input pl-7"
                      placeholder="∞"
                      value={filters.maxAmount}
                      onChange={(e) => set('maxAmount', e.target.value)}
                    />
                  </div>
                </label>
              </div>

              <div>
                <button type="button" onClick={onReset} className="btn-ghost text-sm">
                  Reset filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
