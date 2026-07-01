import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './Icon';
import { cn } from '../lib/cn';
import { formatDate, todayISO } from '../lib/format';

/** A styled date picker with a popover month grid and quick presets. */
export function DateField({
  value,
  onChange,
  max,
  id,
}: {
  value: string; // YYYY-MM-DD
  onChange: (next: string) => void;
  max?: string; // YYYY-MM-DD (inclusive)
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Month currently shown in the grid.
  const [view, setView] = useState(() => value || todayISO());

  useEffect(() => {
    if (open) setView(value || todayISO());
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const [vy, vm] = useMemo(() => {
    const [y, m] = view.split('-').map(Number);
    return [y, m - 1] as const;
  }, [view]);

  const grid = useMemo(() => buildMonth(vy, vm), [vy, vm]);
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(vy, vm, 1));

  const shift = (delta: number) => {
    const d = new Date(vy, vm + delta, 1);
    setView(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`);
  };

  const pick = (iso: string) => {
    if (max && iso > max) return;
    onChange(iso);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        className="input flex items-center justify-between gap-2 text-left"
      >
        <span className={cn(!value && 'text-content-muted')}>
          {value ? formatDate(value) : 'Select date'}
        </span>
        <Icon name="calendar" size={16} className="text-content-muted" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="card absolute z-30 mt-2 w-[17rem] p-3 shadow-soft-lg"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => shift(-1)}
                className="rounded-lg p-1.5 text-content-muted hover:bg-surface-2 hover:text-content"
              >
                <Icon name="chevron-left" size={16} />
              </button>
              <span className="text-sm font-medium">{monthLabel}</span>
              <button
                type="button"
                onClick={() => shift(1)}
                className="rounded-lg p-1.5 text-content-muted hover:bg-surface-2 hover:text-content"
              >
                <Icon name="chevron-right" size={16} />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 text-center text-[11px] text-content-muted">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {grid.map((cell) => {
                if (!cell) return <span key={Math.random()} />;
                const isSelected = cell.iso === value;
                const isToday = cell.iso === todayISO();
                const disabled = !!max && cell.iso > max;
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    disabled={disabled}
                    onClick={() => pick(cell.iso)}
                    className={cn(
                      'grid h-8 place-items-center rounded-lg text-sm transition',
                      disabled && 'cursor-not-allowed text-content-muted/40',
                      !disabled && !isSelected && 'hover:bg-surface-2',
                      isSelected && 'bg-brand text-brand-fg',
                      !isSelected && isToday && 'text-brand',
                    )}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex gap-1.5 border-t border-border pt-2">
              <button
                type="button"
                onClick={() => pick(todayISO())}
                className="btn-ghost h-8 flex-1 px-2 text-xs"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => pick(addDays(todayISO(), -1))}
                className="btn-ghost h-8 flex-1 px-2 text-xs"
              >
                Yesterday
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

interface Cell {
  iso: string;
  day: number;
}

/** Build a Monday-first 6-week grid; leading blanks are null. */
function buildMonth(year: number, month: number): (Cell | null)[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Cell | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: `${year}-${pad(month + 1)}-${pad(d)}`, day: d });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
