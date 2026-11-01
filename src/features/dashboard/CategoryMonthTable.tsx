import { useEffect, useMemo, useRef, useState } from 'react';

import type { ReportTx, ResolvedRange } from '@/features/reports/api';
import { CategoryBadge } from '@/shared/components/CategoryBadge';
import { EmptyState } from '@/shared/components/EmptyState';
import { Icon } from '@/shared/components/Icon';
import { Skeleton } from '@/shared/components/Skeleton';
import { cn } from '@/shared/lib/cn';
import { formatMoney } from '@/shared/lib/format';

const pad = (n: number) => String(n).padStart(2, '0');

/** Inclusive "YYYY-MM" months from `from` to `to`. */
function monthsBetween(from: string, to: string): string[] {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  const out: string[] = [];
  for (
    let d = new Date(fy, fm - 1, 1);
    d <= new Date(ty, tm - 1, 1);
    d.setMonth(d.getMonth() + 1)
  ) {
    out.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  }
  return out;
}

function monthHeading(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const short = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(
    new Date(y, m - 1, 1),
  );
  return `${short} '${String(y).slice(2)}`;
}

interface CategoryRow {
  name: string;
  color: string;
  icon: string | null;
  byMonth: Map<string, number>;
  total: number;
}

interface Group {
  kind: ReportTx['kind'];
  label: string;
  rows: CategoryRow[];
  byMonth: Map<string, number>;
  total: number;
}

function groupFor(kind: ReportTx['kind'], label: string, txs: ReportTx[]): Group {
  const cats = new Map<string, CategoryRow>();
  const byMonth = new Map<string, number>();
  let total = 0;
  for (const t of txs) {
    const month = t.date.slice(0, 7);
    let row = cats.get(t.category);
    if (!row) {
      row = {
        name: t.category,
        color: t.categoryColor,
        icon: t.categoryIcon,
        byMonth: new Map(),
        total: 0,
      };
      cats.set(t.category, row);
    }
    row.byMonth.set(month, (row.byMonth.get(month) ?? 0) + t.amountBase);
    row.total += t.amountBase;
    byMonth.set(month, (byMonth.get(month) ?? 0) + t.amountBase);
    total += t.amountBase;
  }
  return {
    kind,
    label,
    rows: [...cats.values()].sort((a, b) => b.total - a.total),
    byMonth,
    total,
  };
}

/**
 * Category × month pivot of the filtered transactions: one row per category,
 * one column per month, grouped into income and expenses. The category column
 * is pinned while the months scroll horizontally; it opens scrolled to the
 * latest month.
 */
export function CategoryMonthTable({
  rows,
  range,
  loading,
}: {
  rows: ReportTx[] | undefined;
  range: ResolvedRange | undefined;
  loading: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  // Groups whose category rows are hidden. Income starts collapsed: its total
  // row is usually all you need, and spending is the detail worth scanning.
  const [collapsed, setCollapsed] = useState<Set<Group['kind']>>(() => new Set(['income']));
  const toggle = (kind: Group['kind']) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });

  const { months, groups } = useMemo(() => {
    if (!rows || !range) return { months: [], groups: [] };
    // All-time starts at the earliest entry rather than 1970.
    const start =
      range.key === 'all_time'
        ? rows.reduce((min, t) => (t.date < min ? t.date : min), range.to)
        : range.from;
    const groups = [
      groupFor(
        'income',
        'Income',
        rows.filter((t) => t.kind === 'income'),
      ),
      groupFor(
        'expense',
        'Expenses',
        rows.filter((t) => t.kind === 'expense'),
      ),
    ].filter((g) => g.rows.length > 0);
    return { months: monthsBetween(start.slice(0, 7), range.to.slice(0, 7)), groups };
  }, [rows, range]);

  // Start at the most recent month; older months are a scroll to the left.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [months]);

  if (loading || !rows) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  }
  if (groups.length === 0) {
    return <EmptyState icon="expenses" title="No transactions match these filters" />;
  }

  // Sticky cells need an opaque background so scrolled months don't show through.
  const stickyCell = 'sticky left-0 z-10 bg-surface';
  const amount = (v: number | undefined) =>
    v ? formatMoney(v) : <span className="text-content-muted/50">—</span>;

  /**
   * Tint a month cell against the previous month in the same row: green when
   * it improved, red when it got worse, nothing when unchanged (or for the
   * first column, which has no prior month). "Better" means lower for
   * expenses and higher for income. Empty months count as zero.
   */
  const trendTint = (kind: Group['kind'], byMonth: Map<string, number>, i: number) => {
    if (i === 0) return '';
    const diff = (byMonth.get(months[i]) ?? 0) - (byMonth.get(months[i - 1]) ?? 0);
    if (Math.abs(diff) < 0.005) return '';
    const better = kind === 'expense' ? diff < 0 : diff > 0;
    return better ? 'bg-success/15' : 'bg-danger/15';
  };

  return (
    <div ref={scroller} className="-mx-5 overflow-x-auto">
      <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-xs text-content-muted">
            <th
              className={cn(
                stickyCell,
                'min-w-[200px] border-b border-r border-border px-5 pb-2 text-left font-medium',
              )}
            >
              Category
            </th>
            {months.map((m) => (
              <th
                key={m}
                className="min-w-[96px] border-b border-border px-3 pb-2 text-right font-medium"
              >
                {monthHeading(m)}
              </th>
            ))}
            <th className="min-w-[110px] border-b border-border px-5 pb-2 text-right font-medium">
              Total
            </th>
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.kind}>
            <tr
              className="cursor-pointer bg-surface-2 text-xs font-semibold"
              onClick={() => toggle(g.kind)}
            >
              <td
                className={cn(
                  stickyCell,
                  'border-b border-r border-border bg-surface-2 px-5 py-2',
                  g.kind === 'income' ? 'text-success' : 'text-content',
                )}
              >
                <button
                  type="button"
                  className="flex items-center gap-1.5"
                  aria-expanded={!collapsed.has(g.kind)}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(g.kind);
                  }}
                >
                  <Icon
                    name="chevron-right"
                    size={13}
                    className={cn('transition-transform', !collapsed.has(g.kind) && 'rotate-90')}
                  />
                  {g.label}
                  <span className="font-normal text-content-muted">({g.rows.length})</span>
                </button>
              </td>
              {months.map((m, i) => (
                <td
                  key={m}
                  className={cn(
                    'border-b border-border px-3 py-2 text-right tabular-nums',
                    trendTint(g.kind, g.byMonth, i),
                  )}
                >
                  {amount(g.byMonth.get(m))}
                </td>
              ))}
              <td className="border-b border-border px-5 py-2 text-right tabular-nums">
                {formatMoney(g.total)}
              </td>
            </tr>
            {!collapsed.has(g.kind) &&
              g.rows.map((r) => (
                <tr key={r.name} className="group">
                  <td
                    className={cn(
                      stickyCell,
                      'border-b border-r border-border px-5 py-2 transition group-hover:bg-surface-2',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <CategoryBadge color={r.color} icon={r.icon} size={26} />
                      <span className="truncate">{r.name}</span>
                    </div>
                  </td>
                  {months.map((m, i) => {
                    const tint = trendTint(g.kind, r.byMonth, i);
                    return (
                      <td
                        key={m}
                        className={cn(
                          'border-b border-border px-3 py-2 text-right tabular-nums transition',
                          tint || 'group-hover:bg-surface-2/60',
                        )}
                      >
                        {amount(r.byMonth.get(m))}
                      </td>
                    );
                  })}
                  <td className="border-b border-border px-5 py-2 text-right font-semibold tabular-nums transition group-hover:bg-surface-2/60">
                    {formatMoney(r.total)}
                  </td>
                </tr>
              ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
