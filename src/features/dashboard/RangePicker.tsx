import { useEffect, useState } from 'react';

import { RANGE_OPTIONS, type RangeSelection } from '@/features/reports/api';
import { DateField } from '@/shared/components/DateField';
import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/lib/cn';
import { formatDate, todayISO } from '@/shared/lib/format';

function rangeLabel(range: RangeSelection): string {
  if (range.key === 'custom') return `${formatDate(range.from)} – ${formatDate(range.to)}`;
  return RANGE_OPTIONS.find((o) => o.key === range.key)?.label ?? range.key;
}

/**
 * Header date-range control: quick-range pills plus explicit From/To dates,
 * matching the transaction FilterBar. A custom range applies once both ends
 * are set.
 */
export function RangePicker({
  value,
  onChange,
}: {
  value: RangeSelection;
  onChange: (next: RangeSelection) => void;
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(value.key === 'custom' ? value.from : '');
  const [to, setTo] = useState(value.key === 'custom' ? value.to : '');

  // Re-seed the custom inputs from the active range each time it opens.
  useEffect(() => {
    if (!open) return;
    setFrom(value.key === 'custom' ? value.from : '');
    setTo(value.key === 'custom' ? value.to : '');
  }, [open, value]);

  const setCustom = (nextFrom: string, nextTo: string) => {
    setFrom(nextFrom);
    setTo(nextTo);
    if (nextFrom && nextTo && nextFrom <= nextTo) {
      onChange({ key: 'custom', from: nextFrom, to: nextTo });
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-ghost h-9 border border-border text-sm"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <Icon name="calendar" size={16} />
        {rangeLabel(value)}
        <Icon name="chevron-down" size={14} />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-[22rem] max-w-[calc(100vw-2rem)] space-y-3 rounded-xl border border-border bg-surface p-3 shadow-soft-lg">
            <div>
              <p className="mb-1.5 text-xs font-medium text-content-muted">Quick ranges</p>
              <div className="flex flex-wrap gap-1.5">
                {RANGE_OPTIONS.map((o) => {
                  const active = value.key === o.key;
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => {
                        onChange({ key: o.key });
                        setOpen(false);
                      }}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition',
                        active
                          ? 'border-brand bg-brand text-brand-fg'
                          : 'border-border text-content-muted hover:border-brand hover:text-content',
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
              <label className="text-xs text-content-muted">
                From
                <DateField
                  value={from}
                  onChange={(v) => setCustom(v, to)}
                  max={to || todayISO()}
                  placeholder="Start"
                  presets={false}
                  className="mt-1"
                />
              </label>
              <label className="text-xs text-content-muted">
                To
                <DateField
                  value={to}
                  onChange={(v) => setCustom(from, v)}
                  min={from || undefined}
                  max={todayISO()}
                  placeholder="End"
                  presets={false}
                  className="mt-1"
                />
              </label>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
