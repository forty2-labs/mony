import {
  buildReport,
  type RangeSelection,
  type ReportData,
  type ReportRow,
  resolveRange,
} from '@/features/reports/report';

/*
 * A fictional year of money for the landing page's live preview. It mirrors
 * supabase/seed.sql (the local demo account) and is generated in the browser:
 * nothing here touches the database. Output depends only on `today`, so the
 * same day always shows the same figures.
 */

/** EUR -> GBP, frozen on the trip's rows like a real entry would be. */
const EUR_RATE = 0.8542;

type Category = NonNullable<ReportRow['category']>;
const CAT: Record<string, Category> = {
  Groceries: { name: 'Groceries', color: '#5E7D4F', icon: 'cart' },
  Dining: { name: 'Dining', color: '#C8873A', icon: 'utensils' },
  Entertainment: { name: 'Entertainment', color: '#B5523B', icon: 'film' },
  Shopping: { name: 'Shopping', color: '#C8B48A', icon: 'bag' },
  Transport: { name: 'Transport', color: '#3E6B5A', icon: 'car' },
  Travel: { name: 'Travel', color: '#6E9C8E', icon: 'plane' },
  Housing: { name: 'Housing', color: '#8A7B66', icon: 'home' },
  Utilities: { name: 'Utilities', color: '#A08A3C', icon: 'bolt' },
  Health: { name: 'Health', color: '#7FA06A', icon: 'activity' },
  'Personal Care': { name: 'Personal Care', color: '#C27C8E', icon: 'sparkles' },
  Charity: { name: 'Charity', color: '#9C4A3A', icon: 'hand-heart' },
  Salary: { name: 'Salary', color: '#1E3B2F', icon: 'wallet' },
  Freelance: { name: 'Freelance', color: '#7F8C6A', icon: 'laptop' },
  Investments: { name: 'Investments', color: '#D4A24C', icon: 'trending-up' },
};

/** Small seeded PRNG (mulberry32): same seed, same sequence. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

export function generateSampleYear(today: Date): { expenses: ReportRow[]; income: ReportRow[] } {
  const rand = mulberry32(2026);
  const between = (min: number, max: number) => round2(min + rand() * (max - min));
  const pick = <T>(items: T[]) => items[Math.floor(rand() * items.length)];
  const todayIso = iso(today);
  const expenses: ReportRow[] = [];
  const income: ReportRow[] = [];
  let id = 0;

  const add = (
    list: ReportRow[],
    date: Date,
    category: Category,
    amount: number,
    notes: string,
    currency = 'GBP',
    rate = 1,
  ) => {
    const occurredOn = iso(date);
    if (occurredOn > todayIso) return;
    list.push({
      id: `s-${++id}`,
      amount_base: round2(amount * rate),
      amount_original: amount,
      currency_original: currency,
      exchange_rate: rate,
      occurred_on: occurredOn,
      notes,
      category,
    });
  };

  for (let m = 11; m >= 0; m--) {
    const start = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const day = (n: number) => new Date(start.getFullYear(), start.getMonth(), n);
    const inMonth = (d: Date) => d.getMonth() === start.getMonth();

    add(income, day(25), CAT.Salary, 3450, 'Monthly salary');
    if (m % 3 === 1) add(income, day(13), CAT.Freelance, between(450, 1100), 'Website project');
    if (m > 0) {
      const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      add(income, monthEnd, CAT.Investments, between(9, 15), 'Savings interest');
    }

    add(expenses, day(1), CAT.Housing, 1250, 'Rent');
    add(expenses, day(7), CAT.Utilities, 64.5, 'Energy');
    add(expenses, day(10), CAT.Utilities, 38, 'Broadband');
    add(expenses, day(15), CAT.Utilities, 142, 'Council tax');
    add(expenses, day(2), CAT.Transport, 98.4, 'Monthly travel pass');
    add(expenses, day(3), CAT.Charity, 15, 'Monthly donation');

    for (let i = 1; i <= 7; i++) {
      const d = day(i * 4 - 1);
      if (!inMonth(d)) continue;
      const note = pick(['Weekly shop', 'Top-up shop', 'Farmers market', 'Bakery']);
      add(expenses, d, CAT.Groceries, between(22, 90), note);
    }
    for (let i = 1; i <= 5; i++) {
      const d = day(i * 6);
      if (!inMonth(d)) continue;
      const note = pick(['Coffee and cake', 'Dinner with friends', 'Lunch out', 'Takeaway']);
      add(expenses, d, CAT.Dining, between(9, 57), note);
    }
    const extras: [Category, string][] = [
      [CAT.Shopping, 'New trainers'],
      [CAT.Entertainment, 'Cinema tickets'],
      [CAT['Personal Care'], 'Haircut'],
    ];
    extras.forEach(([cat, note], i) =>
      add(expenses, day((i + 1) * 9 + 1), cat, between(18, 113), note),
    );
    if (m % 2 === 0) add(expenses, day(18), CAT.Health, between(12, 57), 'Pharmacy');
  }

  // A trip abroad four months ago, paid in euros.
  const trip = new Date(today.getFullYear(), today.getMonth() - 4, 1);
  const tripDay = (n: number) => new Date(trip.getFullYear(), trip.getMonth(), n);
  add(expenses, tripDay(11), CAT.Travel, 286, 'Hotel, Lisbon', 'EUR', EUR_RATE);
  add(expenses, tripDay(12), CAT.Dining, 64.8, 'Dinner, Lisbon', 'EUR', EUR_RATE);
  add(expenses, tripDay(13), CAT.Travel, 42.5, 'Train to Sintra', 'EUR', EUR_RATE);
  add(expenses, tripDay(14), CAT.Dining, 31.2, 'Lunch, Lisbon', 'EUR', EUR_RATE);

  return { expenses, income };
}

/** The report the dashboard would show for `selection`, computed from the sample year. */
export function sampleReport(selection: RangeSelection, today: Date = new Date()): ReportData {
  const { expenses, income } = generateSampleYear(today);
  const range = resolveRange(selection, today);
  const within = (from: string, to: string) => (r: ReportRow) =>
    r.occurred_on >= from && r.occurred_on <= to;
  const total = (rows: ReportRow[]) => round2(rows.reduce((a, r) => a + r.amount_base, 0));

  const prev = range.prev
    ? {
        totalIncome: total(income.filter(within(range.prev.from, range.prev.to))),
        totalExpenses: total(expenses.filter(within(range.prev.from, range.prev.to))),
      }
    : undefined;

  return buildReport(
    range,
    expenses.filter(within(range.from, range.to)),
    income.filter(within(range.from, range.to)),
    prev,
  );
}
