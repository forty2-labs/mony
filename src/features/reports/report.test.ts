import { describe, expect, it } from 'vitest';

import { buildReport, type ReportRow, type ResolvedRange } from './report';

const range: ResolvedRange = { key: 'custom', label: 'x', from: '2026-01-01', to: '2026-03-31' };

let n = 0;
function row(amount: number, date = '2026-02-10', category: string | null = 'Food'): ReportRow {
  return {
    id: `r${++n}`,
    amount_base: amount,
    amount_original: amount,
    currency_original: 'GBP',
    exchange_rate: 1,
    occurred_on: date,
    notes: null,
    category: category ? { name: category, color: '#123456', icon: null } : null,
  };
}

describe('buildReport', () => {
  it('totals income, expenses, net and savings rate', () => {
    const r = buildReport(range, [row(100), row(50.5)], [row(1000, '2026-02-25', 'Salary')]);
    expect(r.totalExpenses).toBe(150.5);
    expect(r.totalIncome).toBe(1000);
    expect(r.net).toBe(849.5);
    expect(r.savingsRate).toBeCloseTo(84.95);
    expect(r.txCount).toBe(3);
  });

  it('ranks categories and shares percentages', () => {
    const r = buildReport(
      range,
      [row(100, '2026-02-01', 'Food'), row(300, '2026-02-02', 'Rent')],
      [],
    );
    expect(r.expenseCategories[0]).toMatchObject({ name: 'Rent', pct: 75 });
    expect(r.expenseCategories[1].pct).toBe(25);

    const unlabelled = buildReport(range, [row(10, '2026-02-01', null)], []);
    expect(unlabelled.expenseCategories[0].name).toBe('Uncategorised');
  });

  it('passes previous totals through as prev with net', () => {
    const r = buildReport(range, [], [], { totalIncome: 500, totalExpenses: 200 });
    expect(r.prev).toEqual({ totalIncome: 500, totalExpenses: 200, net: 300 });
    expect(buildReport(range, [], []).prev).toBeUndefined();
  });

  it('sorts transactions newest first and builds one trend point per month', () => {
    const r = buildReport(range, [row(10, '2026-01-05'), row(20, '2026-03-05')], []);
    expect(r.transactions[0].date).toBe('2026-03-05');
    expect(r.trend.map((p) => p.month)).toEqual(['2026-01', '2026-02', '2026-03']);
  });

  it('returns a null savings rate without income', () => {
    expect(buildReport(range, [row(10)], []).savingsRate).toBeNull();
  });
});
