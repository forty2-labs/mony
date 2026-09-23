import { supabase } from '@/shared/lib/supabase';

/** Selectable reporting windows. Order here drives the range picker. */
export type RangeKey =
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'this_year'
  | 'last_12_months'
  | 'all_time';

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'last_3_months', label: 'Last 3 months' },
  { key: 'last_6_months', label: 'Last 6 months' },
  { key: 'this_year', label: 'This year' },
  { key: 'last_12_months', label: 'Last 12 months' },
  { key: 'all_time', label: 'All time' },
];

export interface ResolvedRange {
  key: RangeKey;
  label: string;
  from: string; // inclusive YYYY-MM-DD
  to: string; // inclusive YYYY-MM-DD
  /** Equal-length window immediately before `from`, for period-over-period deltas. */
  prev?: { from: string; to: string };
}

export interface ReportCategory {
  name: string;
  color: string;
  icon: string | null;
  total: number;
  pct: number; // share of that kind's total, 0–100
}

export interface ReportTrendPoint {
  month: string; // "YYYY-MM"
  label: string; // "Jul '26"
  income: number;
  expenses: number;
  net: number;
}

export interface ReportTx {
  id: string;
  kind: 'expense' | 'income';
  date: string;
  category: string;
  notes: string | null;
  amountOriginal: number;
  currency: string;
  exchangeRate: number;
  amountBase: number;
}

export interface ReportData {
  range: ResolvedRange;
  totalIncome: number;
  totalExpenses: number;
  net: number;
  /** Net as a share of income, 0–100. Null when there is no income. */
  savingsRate: number | null;
  avgMonthlyExpenses: number;
  monthsInRange: number;
  txCount: number;
  expenseCategories: ReportCategory[];
  incomeCategories: ReportCategory[];
  trend: ReportTrendPoint[];
  transactions: ReportTx[];
  /** Totals for the equal-length preceding window, when one exists. */
  prev?: { totalIncome: number; totalExpenses: number; net: number };
}

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (s: string, delta: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + delta);
  return iso(d);
};

/** Number of whole days between two inclusive YYYY-MM-DD dates. */
function daysBetween(from: string, to: string): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000);
}

/** Resolve a preset key into concrete date bounds (+ a comparison window). */
export function resolveRange(key: RangeKey): ResolvedRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = iso(now);

  let from: string;
  let to = today;

  switch (key) {
    case 'this_month':
      from = iso(new Date(y, m, 1));
      break;
    case 'last_month':
      from = iso(new Date(y, m - 1, 1));
      to = iso(new Date(y, m, 0)); // last day of previous month
      break;
    case 'last_3_months':
      from = iso(new Date(y, m - 2, 1));
      break;
    case 'last_6_months':
      from = iso(new Date(y, m - 5, 1));
      break;
    case 'this_year':
      from = iso(new Date(y, 0, 1));
      break;
    case 'last_12_months':
      from = iso(new Date(y, m - 11, 1));
      break;
    case 'all_time':
      from = '1970-01-01';
      break;
  }

  const label = RANGE_OPTIONS.find((o) => o.key === key)?.label ?? key;

  // Equal-length preceding window (skip for all-time — there is nothing before).
  let prev: ResolvedRange['prev'];
  if (key !== 'all_time') {
    const span = daysBetween(from, to);
    const prevTo = addDays(from, -1);
    prev = { from: addDays(prevTo, -span), to: prevTo };
  }

  return { key, label, from, to, prev };
}

/** Inclusive list of "YYYY-MM" month buckets spanning two dates. */
function monthsSpan(fromMonth: string, toMonth: string): string[] {
  const [fy, fm] = fromMonth.split('-').map(Number);
  const [ty, tm] = toMonth.split('-').map(Number);
  const out: string[] = [];
  let cur = new Date(fy, fm - 1, 1);
  const end = new Date(ty, tm - 1, 1);
  while (cur <= end) {
    out.push(`${cur.getFullYear()}-${pad(cur.getMonth() + 1)}`);
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return out;
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const short = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(
    new Date(y, m - 1, 1),
  );
  return `${short} '${String(y).slice(2)}`;
}

interface ExpenseRow {
  id: string;
  amount_base: number;
  amount_original: number;
  currency_original: string;
  exchange_rate: number;
  occurred_on: string;
  notes: string | null;
  category: { name: string; color: string | null; icon: string | null } | null;
}
interface IncomeRow {
  id: string;
  amount_base: number;
  amount_original: number;
  currency_original: string;
  exchange_rate: number;
  occurred_on: string;
  notes: string | null;
  category: { name: string; color: string | null; icon: string | null } | null;
}

const EXP_SELECT =
  'id, amount_base, amount_original, currency_original, exchange_rate, occurred_on, notes, category:categories(name, color, icon)';
const INC_SELECT = EXP_SELECT;

/** Roll a set of rows up into a ranked, percentage-shared category breakdown. */
function categoryBreakdown(
  rows: { amount_base: number; category: ExpenseRow['category'] }[],
): ReportCategory[] {
  const total = rows.reduce((a, r) => a + Number(r.amount_base), 0);
  const byCat = new Map<string, ReportCategory>();
  for (const r of rows) {
    const name = r.category?.name ?? 'Uncategorised';
    const existing = byCat.get(name);
    if (existing) existing.total += Number(r.amount_base);
    else
      byCat.set(name, {
        name,
        color: r.category?.color ?? '#98989D',
        icon: r.category?.icon ?? null,
        total: Number(r.amount_base),
        pct: 0,
      });
  }
  const list = [...byCat.values()].sort((a, b) => b.total - a.total);
  for (const c of list) c.pct = total ? (c.total / total) * 100 : 0;
  return list;
}

export async function fetchReport(key: RangeKey): Promise<ReportData> {
  const range = resolveRange(key);

  const requests = [
    supabase
      .from('expenses')
      .select(EXP_SELECT)
      .is('deleted_at', null)
      .gte('occurred_on', range.from)
      .lte('occurred_on', range.to)
      .order('occurred_on', { ascending: false }),
    supabase
      .from('income')
      .select(INC_SELECT)
      .is('deleted_at', null)
      .gte('occurred_on', range.from)
      .lte('occurred_on', range.to)
      .order('occurred_on', { ascending: false }),
  ] as const;

  const prevRequests = range.prev
    ? ([
        supabase
          .from('expenses')
          .select('amount_base')
          .is('deleted_at', null)
          .gte('occurred_on', range.prev.from)
          .lte('occurred_on', range.prev.to),
        supabase
          .from('income')
          .select('amount_base')
          .is('deleted_at', null)
          .gte('occurred_on', range.prev.from)
          .lte('occurred_on', range.prev.to),
      ] as const)
    : null;

  const [expRes, incRes, prevExpRes, prevIncRes] = await Promise.all([
    requests[0],
    requests[1],
    prevRequests ? prevRequests[0] : Promise.resolve(null),
    prevRequests ? prevRequests[1] : Promise.resolve(null),
  ]);

  for (const res of [expRes, incRes, prevExpRes, prevIncRes]) {
    if (res && res.error) throw res.error;
  }

  const expenses = (expRes.data ?? []) as unknown as ExpenseRow[];
  const income = (incRes.data ?? []) as unknown as IncomeRow[];

  const totalExpenses = expenses.reduce((a, e) => a + Number(e.amount_base), 0);
  const totalIncome = income.reduce((a, i) => a + Number(i.amount_base), 0);
  const net = totalIncome - totalExpenses;

  // Monthly trend. For open-ended ranges (all-time / long windows) cap the
  // buckets to the trailing 24 months so the chart stays legible; the headline
  // totals above still cover the full range.
  const toMonth = range.to.slice(0, 7);
  const earliest =
    expenses.length || income.length
      ? [...expenses, ...income].reduce(
          (min, r) => (r.occurred_on < min ? r.occurred_on : min),
          range.to,
        )
      : range.to;
  const naturalStart = range.key === 'all_time' ? earliest.slice(0, 7) : range.from.slice(0, 7);
  const [ty, tm] = toMonth.split('-').map(Number);
  const capStart = `${new Date(ty, tm - 1 - 23, 1).getFullYear()}-${pad(
    new Date(ty, tm - 1 - 23, 1).getMonth() + 1,
  )}`;
  const trendStart = naturalStart < capStart ? capStart : naturalStart;

  const trend: ReportTrendPoint[] = monthsSpan(trendStart, toMonth).map((month) => ({
    month,
    label: monthLabel(month),
    income: 0,
    expenses: 0,
    net: 0,
  }));
  const idx = new Map(trend.map((t) => [t.month, t]));
  for (const e of expenses) {
    const t = idx.get(e.occurred_on.slice(0, 7));
    if (t) t.expenses += Number(e.amount_base);
  }
  for (const i of income) {
    const t = idx.get(i.occurred_on.slice(0, 7));
    if (t) t.income += Number(i.amount_base);
  }
  for (const t of trend) t.net = t.income - t.expenses;

  const monthsInRange = monthsSpan(naturalStart, toMonth).length;

  const mapTx = (r: ExpenseRow | IncomeRow, kind: 'expense' | 'income'): ReportTx => ({
    id: r.id,
    kind,
    date: r.occurred_on,
    category: r.category?.name ?? 'Uncategorised',
    notes: r.notes,
    amountOriginal: Number(r.amount_original),
    currency: r.currency_original,
    exchangeRate: Number(r.exchange_rate),
    amountBase: Number(r.amount_base),
  });

  const allTx: ReportTx[] = [
    ...expenses.map((e) => mapTx(e, 'expense')),
    ...income.map((i) => mapTx(i, 'income')),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const prev =
    prevExpRes && prevIncRes
      ? (() => {
          const pe = ((prevExpRes.data ?? []) as { amount_base: number }[]).reduce(
            (a, r) => a + Number(r.amount_base),
            0,
          );
          const pi = ((prevIncRes.data ?? []) as { amount_base: number }[]).reduce(
            (a, r) => a + Number(r.amount_base),
            0,
          );
          return { totalIncome: pi, totalExpenses: pe, net: pi - pe };
        })()
      : undefined;

  return {
    range,
    totalIncome,
    totalExpenses,
    net,
    savingsRate: totalIncome > 0 ? (net / totalIncome) * 100 : null,
    avgMonthlyExpenses: monthsInRange ? totalExpenses / monthsInRange : totalExpenses,
    monthsInRange,
    txCount: expenses.length + income.length,
    expenseCategories: categoryBreakdown(expenses),
    incomeCategories: categoryBreakdown(income),
    trend,
    transactions: allTx,
    prev,
  };
}
