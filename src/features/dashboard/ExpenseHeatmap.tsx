import { useMemo } from 'react';

import { cn } from '@/shared/lib/cn';
import { formatDate, formatMoney } from '@/shared/lib/format';

import type { ExpenseHeatmap as HeatmapData, HeatDay } from './api';

/** Tailwind class per intensity bucket — the app's brand token at rising opacity. */
const LEVEL_CLASS: Record<HeatDay['level'], string> = {
  0: 'bg-surface-2',
  1: 'bg-brand/25',
  2: 'bg-brand/50',
  3: 'bg-brand/75',
  4: 'bg-brand',
};

const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function shortMonth(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(`${iso}T00:00:00`));
}

/**
 * GitHub-style contribution grid of daily expense intensity. Columns are weeks
 * (Sunday at top); colour ramps with how much was spent that day.
 */
export function ExpenseHeatmap({ data }: { data: HeatmapData }) {
  // Chunk the chronological (Sunday-aligned) days into week columns of 7.
  const weeks = useMemo(() => {
    const out: (HeatDay | null)[][] = [];
    for (let i = 0; i < data.days.length; i += 7) {
      const week = data.days.slice(i, i + 7) as (HeatDay | null)[];
      while (week.length < 7) week.push(null); // pad the final (current) week
      out.push(week);
    }
    return out;
  }, [data.days]);

  // A month label sits above the first week column that belongs to a new month.
  const monthLabels = useMemo(() => {
    let prev = '';
    return weeks.map((week) => {
      const first = week.find(Boolean);
      const m = first ? first.date.slice(0, 7) : '';
      if (m && m !== prev) {
        prev = m;
        return shortMonth(first!.date);
      }
      return '';
    });
  }, [weeks]);

  return (
    <div>
      {/* Month labels — a spacer matching the weekday gutter, then one flex slot
          per week column so labels sit above the right column. */}
      <div className="flex gap-[2px]">
        <div className="w-7 shrink-0" />
        {monthLabels.map((label, i) => (
          <div
            key={i}
            className="min-w-0 flex-1 whitespace-nowrap text-[10px] leading-4 text-content-muted"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Weekday gutter + fluid week columns. Columns are flex-1 and cells are
          aspect-square, so the whole grid scales to the parent width. */}
      <div className="flex gap-[2px]">
        <div className="flex w-7 shrink-0 flex-col gap-[2px] pr-1 text-right text-[10px] text-content-muted">
          {WEEKDAY_LABELS.map((d, i) => (
            <span key={i} className="flex flex-1 items-center justify-end leading-none">
              {d}
            </span>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="flex min-w-0 flex-1 flex-col gap-[2px]">
            {week.map((day, di) =>
              day ? (
                <div
                  key={day.date}
                  title={
                    day.total > 0
                      ? `${formatMoney(day.total)} · ${formatDate(day.date)}`
                      : `No expenses · ${formatDate(day.date)}`
                  }
                  className={cn(
                    'aspect-square w-full rounded-[3px] ring-1 ring-inset ring-border/40',
                    LEVEL_CLASS[day.level],
                  )}
                />
              ) : (
                <div key={di} className="aspect-square w-full" />
              ),
            )}
          </div>
        ))}
      </div>

      {/* Summary + legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-content-muted">
        <span>
          <span className="font-medium text-content">{formatMoney(data.total)}</span> spent over{' '}
          {data.activeDays} active {data.activeDays === 1 ? 'day' : 'days'} this year
        </span>
        <span className="flex items-center gap-1.5">
          Less
          {([0, 1, 2, 3, 4] as const).map((l) => (
            <span
              key={l}
              className={cn(
                'h-[11px] w-[11px] rounded-[3px] ring-1 ring-inset ring-border/40',
                LEVEL_CLASS[l],
              )}
            />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
