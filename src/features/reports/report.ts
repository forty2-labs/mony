import { formatDate } from '@/shared/lib/format';

/*
 * Report maths: ranges, category breakdowns, monthly trend and the report
 * itself. No Supabase here, so it is unit-testable and the landing page can run
 * it in the browser over sample data. Fetching lives in ./api.
 */
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

/** What the user picked: a preset window, or explicit inclusive dates. */
export type RangeSelection = { key: RangeKey } | { key: 'custom'; from: string; to: string };

export interface ResolvedRange {
  key: RangeKey | 'custom';
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
  categoryColor: string;
  categoryIcon: string | null;
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

/** Resolve a selection into concrete date bounds (+ a comparison window), relative to `now`. */
export function resolveRange(selection: RangeSelection, now: Date = new Date()): ResolvedRange {
  if (selection.key === 'custom') {
    const { from, to } = selection;
    const prevTo = addDays(from, -1);
    return {
      key: 'custom',
      label: `${formatDate(from)} – ${formatDate(to)}`,
      from,
      to,
      prev: { from: addDays(prevTo, -daysBetween(from, to)), to: prevTo },
    };
  }

  const { key } = selection;
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

/** A transaction row as reports consume it (expense or income, with its category). */
export interface ReportRow {
  id: string;
  amount_base: number;
  amount_original: number;
  currency_original: string;
  exchange_rate: number;
  occurred_on: string;
  notes: string | null;
  category: { name: string; color: string | null; icon: string | null } | null;
}

/** Roll a set of rows up into a ranked, percentage-shared category breakdown. */
function categoryBreakdown(
  rows: { amount_base: number; category: ReportRow['category'] }[],
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

/** First month the trend should cover: the range start, or for all-time the
 *  month of the earliest transaction. */
function trendNaturalStart(transactions: ReportTx[], range: ResolvedRange): string {
  if (range.key !== 'all_time') return range.from.slice(0, 7);
  const earliest = transactions.reduce((min, t) => (t.date < min ? t.date : min), range.to);
  return earliest.slice(0, 7);
}

/**
 * Monthly income/expense/net buckets for a set of transactions. For open-ended
 * ranges (all-time / long windows) the buckets are capped to the trailing 24
 * months so the chart stays legible; headline totals still cover the full range.
 */
function buildTrend(transactions: ReportTx[], range: ResolvedRange): ReportTrendPoint[] {
  const toMonth = range.to.slice(0, 7);
  const naturalStart = trendNaturalStart(transactions, range);
  const [ty, tm] = toMonth.split('-').map(Number);
  const cap = new Date(ty, tm - 1 - 23, 1);
  const capStart = `${cap.getFullYear()}-${pad(cap.getMonth() + 1)}`;
  const trendStart = naturalStart < capStart ? capStart : naturalStart;

  const trend: ReportTrendPoint[] = monthsSpan(trendStart, toMonth).map((month) => ({
    month,
    label: monthLabel(month),
    income: 0,
    expenses: 0,
    net: 0,
  }));
  const idx = new Map(trend.map((t) => [t.month, t]));
  for (const tx of transactions) {
    const t = idx.get(tx.date.slice(0, 7));
    if (!t) continue;
    if (tx.kind === 'income') t.income += tx.amountBase;
    else t.expenses += tx.amountBase;
  }
  for (const t of trend) t.net = t.income - t.expenses;
  return trend;
}

/**
 * Turn a range's expense and income rows into the report: totals, savings
 * rate, category breakdowns, monthly trend and the transaction list. Pure, so
 * it runs on fetched rows and on the landing page's sample data alike.
 */
export function buildReport(
  range: ResolvedRange,
  expenses: ReportRow[],
  income: ReportRow[],
  prevTotals?: { totalIncome: number; totalExpenses: number },
): ReportData {
  const totalExpenses = expenses.reduce((a, e) => a + Number(e.amount_base), 0);
  const totalIncome = income.reduce((a, i) => a + Number(i.amount_base), 0);
  const net = totalIncome - totalExpenses;

  const mapTx = (r: ReportRow, kind: 'expense' | 'income'): ReportTx => ({
    id: r.id,
    kind,
    date: r.occurred_on,
    category: r.category?.name ?? 'Uncategorised',
    categoryColor: r.category?.color ?? '#98989D',
    categoryIcon: r.category?.icon ?? null,
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

  const trend = buildTrend(allTx, range);
  const monthsInRange = monthsSpan(trendNaturalStart(allTx, range), range.to.slice(0, 7)).length;

  const prev = prevTotals
    ? { ...prevTotals, net: prevTotals.totalIncome - prevTotals.totalExpenses }
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
