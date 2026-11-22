import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/lib/cn';

/*
 * Small, live illustrations for the "How it works" steps. They're built from
 * the app's own vocabulary (rows, category chips, a trend line, a budget bar)
 * with theme tokens, so they stay crisp and follow light/dark. All figures are
 * fictional. Each plays a short entrance the first time it scrolls into view;
 * with reduced motion it simply appears.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/** Entrance props for one element, staggered by `i`; inert under reduced motion. */
function useReveal() {
  const reduce = useReducedMotion();
  return (i: number, from: { x?: number; y?: number } = { y: 8 }) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, ...from },
          whileInView: { opacity: 1, x: 0, y: 0 },
          viewport: { once: true, amount: 0.6 },
          transition: { duration: 0.5, ease: EASE, delay: 0.15 + i * 0.09 },
        };
}

function Stage({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="relative mb-6 h-52 overflow-hidden rounded-2xl border border-border bg-surface-2/60"
    >
      {/* Faint dot grid, like graph paper under the scene. */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(rgb(var(--border)) 1px, transparent 1px)',
          backgroundSize: '14px 14px',
        }}
      />
      {children}
    </div>
  );
}

const CSV_ROWS: [string, string, string][] = [
  ['03 Nov', 'Corner shop', '-18.40'],
  ['06 Nov', 'Coffee', '-3.20'],
  ['12 Nov', 'Rent', '-1250.00'],
  ['25 Nov', 'Salary', '+3450.00'],
];

/** Step 1: a CSV statement downloading from "any bank". */
export function ExportIllustration() {
  const reveal = useReveal();
  return (
    <Stage>
      <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
        {['Monzo', 'Revolut', 'Wise', 'Any bank'].map((bank, i) => (
          <motion.span
            key={bank}
            {...reveal(i, { y: -6 })}
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] font-medium',
              bank === 'Any bank'
                ? 'border-brand/40 bg-brand/10 text-brand'
                : 'border-border bg-surface text-content-muted',
            )}
          >
            {bank}
          </motion.span>
        ))}
      </div>

      {/* A second sheet behind, for depth. */}
      <div className="absolute left-10 right-5 top-[3.4rem] h-40 rotate-[3deg] rounded-xl border border-border bg-surface/60" />

      <motion.div
        {...reveal(2, { y: 18 })}
        className="absolute left-6 right-9 top-12 rounded-xl border border-border bg-surface p-3 shadow-soft"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-success/15 text-success">
            <Icon name="file" size={13} />
          </span>
          <span className="text-[11px] font-semibold">statement.csv</span>
        </div>
        <div className="font-mono text-[9.5px] leading-[1.55] text-content-muted">
          <div className="text-content/70">date,description,amount</div>
          {CSV_ROWS.map(([d, desc, amt], i) => (
            <motion.div key={desc} {...reveal(3 + i, { x: -8 })} className="truncate">
              {d},{desc},
              <span className={amt.startsWith('+') ? 'text-success' : undefined}>{amt}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.span
        {...reveal(8, { y: -10 })}
        className="icon-badge absolute bottom-4 right-4 h-10 w-10 shadow-soft"
      >
        <Icon name="download" size={18} />
      </motion.span>
    </Stage>
  );
}

const REVIEW_ROWS: {
  desc: string;
  amount: string;
  category?: { name: string; color: string };
  transfer?: boolean;
}[] = [
  { desc: 'Corner shop', amount: '£18.40', category: { name: 'Groceries', color: '#5E7D4F' } },
  { desc: 'Coffee', amount: '£3.20', category: { name: 'Dining', color: '#C8873A' } },
  { desc: 'To my savings', amount: '£200.00', transfer: true },
  { desc: 'Rent', amount: '£1,250.00', category: { name: 'Housing', color: '#8A7B66' } },
];

/** Step 2: review rows with categories filled in and a transfer set aside. */
export function ReviewIllustration() {
  const reveal = useReveal();
  return (
    <Stage>
      <div className="absolute inset-x-4 top-4 space-y-1.5">
        {REVIEW_ROWS.map((r, i) => (
          <motion.div
            key={r.desc}
            {...reveal(i, { x: 14 })}
            className={cn(
              'flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[10.5px]',
              r.transfer && 'opacity-60',
            )}
          >
            <span
              className={cn(
                'grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[4px] border',
                r.transfer ? 'border-border' : 'border-brand bg-brand text-brand-fg',
              )}
            >
              {r.transfer ? null : <Icon name="check" size={9} />}
            </span>
            <span
              className={cn('min-w-0 flex-1 truncate font-medium', r.transfer && 'line-through')}
            >
              {r.desc}
            </span>
            {r.category ? (
              <span
                className="shrink-0 rounded-full px-1.5 py-px text-[9px] font-medium"
                style={{ backgroundColor: r.category.color + '26', color: r.category.color }}
              >
                {r.category.name}
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-warning/15 px-1.5 py-px text-[9px] font-medium text-warning">
                Transfer
              </span>
            )}
            <span className="w-14 shrink-0 text-right tabular-nums text-content-muted">
              {r.amount}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="absolute inset-x-4 bottom-3.5 flex items-center justify-between gap-2">
        <motion.span
          {...reveal(4, { y: 10 })}
          className="inline-flex min-w-0 items-center gap-1 text-[10px] text-content-muted"
        >
          <Icon name="sparkles" size={12} className="shrink-0 text-brand" />
          <span className="truncate">Categories suggested</span>
        </motion.span>
        <motion.span
          {...reveal(5, { y: 10 })}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-[10.5px] font-medium text-brand-fg shadow-soft"
        >
          <Icon name="import" size={12} />
          Import 3 rows
        </motion.span>
      </div>
    </Stage>
  );
}

/** Step 3: a trend line drawing in and a budget filling up. */
export function InsightIllustration() {
  const reduce = useReducedMotion();
  const reveal = useReveal();
  const draw = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { pathLength: 0 },
          whileInView: { pathLength: 1 },
          viewport: { once: true, amount: 0.6 },
          transition: { duration: 1.2, ease: EASE, delay },
        };
  const income = 'M0 58 C 30 56 45 40 70 42 S 115 30 140 34 S 190 18 220 14';
  const spend = 'M0 74 C 30 72 50 70 75 66 S 120 72 145 64 S 195 62 220 58';

  return (
    <Stage>
      <motion.div
        {...reveal(0)}
        className="absolute inset-x-4 top-4 rounded-xl border border-border bg-surface p-3 shadow-soft"
      >
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[10px] text-content-muted">Net saved · 12 months</span>
          <span className="text-[13px] font-semibold tabular-nums text-success">£11,856</span>
        </div>
        <svg viewBox="0 0 220 84" className="h-16 w-full" preserveAspectRatio="none">
          <motion.path
            d={`${income} L220 84 L0 84 Z`}
            fill="rgb(var(--success) / 0.12)"
            {...(reduce
              ? {}
              : {
                  initial: { opacity: 0 },
                  whileInView: { opacity: 1 },
                  viewport: { once: true },
                  transition: { delay: 0.9, duration: 0.6 },
                })}
          />
          <motion.path
            d={income}
            fill="none"
            stroke="rgb(var(--success))"
            strokeWidth="2.2"
            strokeLinecap="round"
            {...draw(0.2)}
          />
          <motion.path
            d={spend}
            fill="none"
            stroke="rgb(var(--danger))"
            strokeWidth="2.2"
            strokeLinecap="round"
            {...draw(0.35)}
          />
        </svg>
      </motion.div>

      <motion.div
        {...reveal(3, { y: 12 })}
        className="absolute bottom-3.5 inset-x-4 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-soft"
      >
        <div className="mb-1.5 flex items-center justify-between text-[10px]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#5E7D4F' }} />
            Groceries
          </span>
          <span className="tabular-nums text-content-muted">£262 of £340</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            className="h-full rounded-full bg-brand"
            style={{ width: '77%', originX: 0 }}
            {...(reduce
              ? {}
              : {
                  initial: { scaleX: 0 },
                  whileInView: { scaleX: 1 },
                  viewport: { once: true },
                  transition: { duration: 0.9, ease: EASE, delay: 0.6 },
                })}
          />
        </div>
      </motion.div>
    </Stage>
  );
}

const ARROWS = {
  // Desktop: from step 1 down to the lower step 2, and from step 2 back up to step 3.
  down: {
    viewBox: '0 0 80 110',
    line: 'M3 12 C 20 2, 31 26, 37 44 S 49 84, 73 92',
    head: 'M66.3 83.9 L73 92 L62.8 94.5',
  },
  up: {
    viewBox: '0 0 80 110',
    line: 'M3 94 C 22 104, 31 76, 37 58 S 47 18, 73 15',
    head: 'M63.5 10.5 L73 15 L64.8 21.5',
  },
  // Phones: a wiggle pointing down to the next step.
  stack: {
    viewBox: '0 0 48 72',
    line: 'M24 3 C 7 17, 41 27, 23 44 S 22 55, 24 64',
    head: 'M27.5 54.1 L24 64 L16.6 56.5',
  },
} as const;

/**
 * A hand-drawn-looking connector between steps: an irregular curve with an
 * open arrowhead, in the brand colour, that draws itself in on first view.
 */
export function FlowArrow({ kind, className }: { kind: keyof typeof ARROWS; className?: string }) {
  const reduce = useReducedMotion();
  const a = ARROWS[kind];
  const draw = (delay: number, duration: number) =>
    reduce
      ? {}
      : {
          initial: { pathLength: 0, opacity: 0 },
          whileInView: { pathLength: 1, opacity: 1 },
          viewport: { once: true, amount: 0.8 },
          transition: { duration, ease: EASE, delay },
        };
  return (
    <svg
      aria-hidden="true"
      viewBox={a.viewBox}
      fill="none"
      stroke="rgb(var(--brand))"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.path d={a.line} {...draw(0.2, 0.9)} />
      <motion.path d={a.head} {...draw(1, 0.3)} />
    </svg>
  );
}
