import { BASE_CURRENCY } from '@/shared/lib/env';

import type { ReportData } from './api';

/** Quote a CSV field, escaping embedded quotes and forcing quotes when needed. */
function csvCell(value: string | number | null): string {
  if (value == null) return '';
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: (string | number | null)[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}

/** A slug like `vault-report-this-month-2026-07-22` for download filenames. */
function baseName(data: ReportData): string {
  return `vault-report-${data.range.key.replace(/_/g, '-')}-${data.range.to}`;
}

/** Transaction-level export: one row per expense/income in the range. */
export function transactionsCsv(data: ReportData): string {
  const header = [
    'Date',
    'Type',
    'Category',
    'Notes',
    'Amount (original)',
    'Currency',
    'Exchange rate',
    `Amount (${BASE_CURRENCY})`,
  ];
  const rows = data.transactions.map((t) => [
    t.date,
    t.kind,
    t.category,
    t.notes,
    t.amountOriginal,
    t.currency,
    t.exchangeRate,
    t.amountBase,
  ]);
  return toCsv([header, ...rows]);
}

/** Summary export: headline totals plus the category breakdowns. */
export function summaryCsv(data: ReportData): string {
  const rows: (string | number | null)[][] = [
    ['Vault report', data.range.label],
    ['Range', `${data.range.from} to ${data.range.to}`],
    [],
    ['Metric', `Value (${BASE_CURRENCY})`],
    ['Total income', data.totalIncome],
    ['Total expenses', data.totalExpenses],
    ['Net', data.net],
    ['Savings rate (%)', data.savingsRate == null ? '' : data.savingsRate.toFixed(1)],
    ['Avg monthly expenses', data.avgMonthlyExpenses.toFixed(2)],
    ['Transactions', data.txCount],
    [],
    ['Expense category', `Total (${BASE_CURRENCY})`, 'Share (%)'],
    ...data.expenseCategories.map((c) => [c.name, c.total, c.pct.toFixed(1)]),
    [],
    ['Income category', `Total (${BASE_CURRENCY})`, 'Share (%)'],
    ...data.incomeCategories.map((c) => [c.name, c.total, c.pct.toFixed(1)]),
  ];
  return toCsv(rows);
}

/** Trigger a client-side download of `content` as a UTF-8 file. */
function download(filename: string, content: string, mime: string): void {
  // Prepend a BOM so Excel opens UTF-8 CSVs with the right encoding.
  const blob = new Blob(['﻿', content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadTransactionsCsv(data: ReportData): void {
  download(`${baseName(data)}-transactions.csv`, transactionsCsv(data), 'text/csv;charset=utf-8');
}

export function downloadSummaryCsv(data: ReportData): void {
  download(`${baseName(data)}-summary.csv`, summaryCsv(data), 'text/csv;charset=utf-8');
}
