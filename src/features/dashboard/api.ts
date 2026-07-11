import { supabase } from '@/shared/lib/supabase';

export interface CategorySlice {
  name: string;
  color: string;
  icon: string | null;
  total: number;
}

export interface RecentTx {
  id: string;
  kind: 'expense' | 'income';
  label: string;
  icon: string | null;
  color: string | null;
  date: string;
  amountBase: number;
}

export interface TrendPoint {
  month: string; // "YYYY-MM"
  label: string; // "Jul"
  income: number;
  expenses: number;
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

export interface DashboardData {
  monthIncome: number;
  monthExpenses: number;
  netThisMonth: number;
  /** All-time income minus all-time expenses — a simple running balance. */
  balance: number;
  categoryBreakdown: CategorySlice[];
  recent: RecentTx[];
  trend: TrendPoint[];
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

/** First and (exclusive) next-month boundaries for a "YYYY-MM". */
function monthBounds(month: string) {
  const [y, m] = month.split('-').map(Number);
  const start = `${y}-${pad(m)}-01`;
  const next = new Date(y, m, 1); // first of next month
  const end = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-01`;
  return { start, end };
}

const sum = (rows: { amount_base: number }[] | null) =>
  (rows ?? []).reduce((acc, r) => acc + Number(r.amount_base), 0);

export async function fetchDashboard(month: string): Promise<DashboardData> {
  const { start, end } = monthBounds(month);
  // 6-month trailing window ending at (and including) the selected month.
  const windowStart = monthBounds(shiftMonth(month, -5)).start;
  const windowEnd = end;

  const [allExpRes, allIncRes, winExpRes, winIncRes, recentExpRes, recentIncRes] =
    await Promise.all([
      supabase.from('expenses').select('amount_base').is('deleted_at', null),
      supabase.from('income').select('amount_base').is('deleted_at', null),
      supabase
        .from('expenses')
        .select('amount_base, occurred_on, category:categories(name, color, icon)')
        .is('deleted_at', null)
        .gte('occurred_on', windowStart)
        .lt('occurred_on', windowEnd),
      supabase
        .from('income')
        .select('amount_base, occurred_on')
        .is('deleted_at', null)
        .gte('occurred_on', windowStart)
        .lt('occurred_on', windowEnd),
      supabase
        .from('expenses')
        .select('id, amount_base, occurred_on, notes, category:categories(name, color, icon)')
        .is('deleted_at', null)
        .order('occurred_on', { ascending: false })
        .limit(5),
      supabase
        .from('income')
        .select('id, amount_base, occurred_on, category:categories(name, color, icon)')
        .is('deleted_at', null)
        .order('occurred_on', { ascending: false })
        .limit(5),
    ]);

  for (const res of [allExpRes, allIncRes, winExpRes, winIncRes, recentExpRes, recentIncRes]) {
    if (res.error) throw res.error;
  }

  const winExp = (winExpRes.data ?? []) as unknown as ExpenseLite[];
  const winInc = (winIncRes.data ?? []) as unknown as IncomeLite[];
  const inMonth = (occurred: string) => occurred >= start && occurred < end;

  const monthExpenses = winExp
    .filter((e) => inMonth(e.occurred_on))
    .reduce((a, e) => a + Number(e.amount_base), 0);
  const monthIncome = winInc
    .filter((i) => inMonth(i.occurred_on))
    .reduce((a, i) => a + Number(i.amount_base), 0);

  // Category breakdown for the selected month.
  const byCat = new Map<string, CategorySlice>();
  for (const row of winExp.filter((e) => inMonth(e.occurred_on))) {
    const name = row.category?.name ?? 'Uncategorised';
    const color = row.category?.color ?? '#98989D';
    const icon = row.category?.icon ?? null;
    const existing = byCat.get(name);
    if (existing) existing.total += Number(row.amount_base);
    else byCat.set(name, { name, color, icon, total: Number(row.amount_base) });
  }
  const categoryBreakdown = [...byCat.values()].sort((a, b) => b.total - a.total);

  // 6-month income vs expense trend.
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) months.push(shiftMonth(month, -i));
  const trend: TrendPoint[] = months.map((mk) => ({
    month: mk,
    label: monthLabel(mk, { month: 'short' }),
    income: 0,
    expenses: 0,
  }));
  const idx = new Map(trend.map((t) => [t.month, t]));
  for (const e of winExp) {
    const t = idx.get(e.occurred_on.slice(0, 7));
    if (t) t.expenses += Number(e.amount_base);
  }
  for (const i of winInc) {
    const t = idx.get(i.occurred_on.slice(0, 7));
    if (t) t.income += Number(i.amount_base);
  }

  // Recent activity feed (all-time, most recent 6).
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

  return {
    monthIncome,
    monthExpenses,
    netThisMonth: monthIncome - monthExpenses,
    balance: sum(allIncRes.data) - sum(allExpRes.data),
    categoryBreakdown,
    recent,
    trend,
  };
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
