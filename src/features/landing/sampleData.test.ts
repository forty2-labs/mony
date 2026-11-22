import { describe, expect, it } from 'vitest';

import { generateSampleYear, sampleReport } from './sampleData';

const today = new Date(2026, 10, 22); // 22 Nov 2026
const sum = (rows: { amount_base: number }[]) => rows.reduce((a, r) => a + r.amount_base, 0);
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

describe('generateSampleYear', () => {
  it('is deterministic for a given day', () => {
    expect(generateSampleYear(new Date(2026, 10, 22))).toEqual(
      generateSampleYear(new Date(2026, 10, 22)),
    );
  });

  it('covers twelve months and nothing in the future', () => {
    const { expenses, income } = generateSampleYear(today);
    const all = [...expenses, ...income];
    expect(new Set(all.map((r) => r.occurred_on.slice(0, 7))).size).toBe(12);
    expect(all.every((r) => r.occurred_on <= '2026-11-22')).toBe(true);
  });

  it('earns more than it spends over the year', () => {
    const { expenses, income } = generateSampleYear(today);
    expect(sum(expenses)).toBeGreaterThan(0);
    expect(sum(income)).toBeGreaterThan(sum(expenses));
  });

  it('includes the euro trip at a frozen rate', () => {
    const eur = generateSampleYear(today).expenses.filter((r) => r.currency_original === 'EUR');
    expect(eur).toHaveLength(4);
    for (const r of eur) {
      expect(r.exchange_rate).toBe(0.8542);
      expect(r.amount_base).toBe(Math.round(r.amount_original * 0.8542 * 100) / 100);
    }
  });

  it('has no future rows on the first of the month or new year', () => {
    for (const day of [new Date(2026, 0, 1), new Date(2026, 2, 1)]) {
      const { expenses, income } = generateSampleYear(day);
      expect([...expenses, ...income].every((r) => r.occurred_on <= iso(day))).toBe(true);
    }
  });
});

describe('sampleReport', () => {
  it('reports the selected range only', () => {
    const r = sampleReport({ key: 'last_3_months' }, today);
    expect(r.transactions.length).toBeGreaterThan(0);
    expect(r.transactions.every((t) => t.date >= r.range.from && t.date <= r.range.to)).toBe(true);
    expect(r.prev).toBeDefined();
  });
});
