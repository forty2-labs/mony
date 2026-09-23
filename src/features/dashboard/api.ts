import { supabase } from '@/shared/lib/supabase';

export interface RecentTx {
  id: string;
  kind: 'expense' | 'income';
  label: string;
  icon: string | null;
  color: string | null;
  date: string;
  amountBase: number;
}

/** All-time snapshot shown on the dashboard, independent of the report range. */
export interface Overview {
  /** All-time income minus all-time expenses — a simple running balance. */
  balance: number;
  recent: RecentTx[];
}

/** One day in the contribution heatmap. `level` is a 0–4 intensity bucket. */
export interface HeatDay {
  date: string; // YYYY-MM-DD
  total: number; // expenses in base currency that day
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ExpenseHeatmap {
  days: HeatDay[]; // chronological, aligned to a Sunday, ending today
  start: string;
  end: string;
  total: number; // total spent across the window
  activeDays: number; // days with any spend
  busiestDay: number; // largest single-day spend
}

interface ExpenseLite {
  id: string;
  amount_base: number;
  occurred_on: string;
  notes: string | null;
  category: { name: string; color: string | null; icon: string | null } | null;
}
interface IncomeLite {
  id: string;
  amount_base: number;
  occurred_on: string;
  category: { name: string; color: string | null; icon: string | null } | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

const isoLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The current month as "YYYY-MM" in local time. */
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthLabel(month: string, opts?: Intl.DateTimeFormatOptions): string {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, opts ?? { month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, 1),
  );
}

const sum = (rows: { amount_base: number }[] | null) =>
  (rows ?? []).reduce((acc, r) => acc + Number(r.amount_base), 0);

/**
 * All-time running balance plus the most recent activity feed. Kept separate
 * from the range-scoped report so it doesn't refetch when the range changes.
 */
export async function fetchOverview(): Promise<Overview> {
  const [allExpRes, allIncRes, recentExpRes, recentIncRes] = await Promise.all([
    supabase.from('expenses').select('amount_base').is('deleted_at', null),
    supabase.from('income').select('amount_base').is('deleted_at', null),
    supabase
      .from('expenses')
      .select('id, amount_base, occurred_on, notes, category:categories(name, color, icon)')
      .is('deleted_at', null)
      .order('occurred_on', { ascending: false })
      .limit(6),
    supabase
      .from('income')
      .select('id, amount_base, occurred_on, category:categories(name, color, icon)')
      .is('deleted_at', null)
      .order('occurred_on', { ascending: false })
      .limit(6),
  ]);

  for (const res of [allExpRes, allIncRes, recentExpRes, recentIncRes]) {
    if (res.error) throw res.error;
  }

  const recentExp = (recentExpRes.data ?? []) as unknown as ExpenseLite[];
  const recentInc = (recentIncRes.data ?? []) as unknown as IncomeLite[];
  const recent: RecentTx[] = [
    ...recentExp.map((e) => ({
      id: e.id,
      kind: 'expense' as const,
      label: e.category?.name ?? e.notes ?? 'Expense',
      icon: e.category?.icon ?? null,
      color: e.category?.color ?? null,
      date: e.occurred_on,
      amountBase: Number(e.amount_base),
    })),
    ...recentInc.map((i) => ({
      id: i.id,
      kind: 'income' as const,
      label: i.category?.name ?? 'Income',
      icon: i.category?.icon ?? null,
      color: i.category?.color ?? null,
      date: i.occurred_on,
      amountBase: Number(i.amount_base),
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  return { balance: sum(allIncRes.data) - sum(allExpRes.data), recent };
}

/**
 * Daily expense totals for a GitHub-style contribution heatmap covering the
 * trailing ~53 weeks. The window is aligned back to a Sunday so it renders as
 * clean week columns. Intensity `level` (1–4) is bucketed by quartiles of the
 * non-zero days, so the scale adapts to the user's own spending distribution
 * rather than being skewed by a single large day.
 */
export async function fetchExpenseHeatmap(): Promise<ExpenseHeatmap> {
  const today = new Date();
  const end = isoLocal(today);

  // 52 weeks back from today, then align to the start of that week (Sunday).
  const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 364);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Sunday = 0
  const start = isoLocal(startDate);

  const { data, error } = await supabase
    .from('expenses')
    .select('amount_base, occurred_on')
    .is('deleted_at', null)
    .gte('occurred_on', start)
    .lte('occurred_on', end);
  if (error) throw error;

  const totals = new Map<string, number>();
  for (const r of (data ?? []) as { amount_base: number; occurred_on: string }[]) {
    totals.set(r.occurred_on, (totals.get(r.occurred_on) ?? 0) + Number(r.amount_base));
  }

  // Quartile thresholds over the non-zero days for adaptive bucketing.
  const nonzero = [...totals.values()].sort((a, b) => a - b);
  const quantile = (p: number) =>
    nonzero.length ? nonzero[Math.min(nonzero.length - 1, Math.floor(p * nonzero.length))] : 0;
  const t1 = quantile(0.25);
  const t2 = quantile(0.5);
  const t3 = quantile(0.75);
  const levelFor = (v: number): HeatDay['level'] =>
    v <= 0 ? 0 : v <= t1 ? 1 : v <= t2 ? 2 : v <= t3 ? 3 : 4;

  const days: HeatDay[] = [];
  for (let cur = new Date(startDate); isoLocal(cur) <= end; cur.setDate(cur.getDate() + 1)) {
    const date = isoLocal(cur);
    const total = totals.get(date) ?? 0;
    days.push({ date, total, level: levelFor(total) });
  }

  return {
    days,
    start,
    end,
    total: nonzero.reduce((a, v) => a + v, 0),
    activeDays: nonzero.length,
    busiestDay: nonzero.length ? nonzero[nonzero.length - 1] : 0,
  };
}
