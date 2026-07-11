import { BASE_CURRENCY } from '@/shared/lib/env';
import { toBaseAmount } from '@/shared/lib/money';

import type { StatementRow } from './csv';
import type { DraftTransaction } from './types';

/**
 * Parse a monetary string into a Number. Strips currency symbols and thousands
 * separators; assumes '.' is the decimal point (true for all target banks).
 * Returns NaN when there's no number to read.
 */
export function parseAmount(raw: string | undefined): number {
  if (!raw) return NaN;
  const cleaned = raw.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  if (!cleaned || cleaned === '-') return NaN;
  return Number.parseFloat(cleaned);
}

/**
 * Normalise a statement date to YYYY-MM-DD. Handles ISO (`2026-01-01 ...`),
 * `DD/MM/YYYY` (Monzo) and `DD-MM-YYYY` (Wise). Returns '' when unrecognised.
 */
export function parseStatementDate(raw: string | undefined): string {
  if (!raw) return '';
  const s = raw.trim();

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;

  return '';
}

function newRowId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `row_${Math.random().toString(36).slice(2)}`;
}

/**
 * Build a draft from a signed amount: a negative amount is money out (expense),
 * positive is money in (income). Currency defaults to base; foreign rows start
 * at rate 1 and are corrected by the review modal's rate lookup.
 */
export function draftFromSigned(params: {
  raw: StatementRow;
  signedAmount: number;
  currency: string;
  date: string;
  description: string;
  suggestedCategory?: string | null;
  notes?: string[];
}): DraftTransaction {
  const { raw, signedAmount, currency, date, description } = params;
  const currencyOriginal = (currency || BASE_CURRENCY).trim().toUpperCase();
  const type = signedAmount < 0 ? 'expense' : 'income';

  return {
    rowId: newRowId(),
    selected: true,
    type,
    occurredOn: parseStatementDate(date),
    description: description.trim(),
    amountOriginal: Number.isFinite(signedAmount) ? Math.abs(signedAmount) : NaN,
    currencyOriginal,
    exchangeRate: 1,
    categoryId: null,
    suggestedCategory: params.suggestedCategory?.trim() || null,
    notes: params.notes ?? [],
    raw,
  };
}

export interface RowValidation {
  valid: boolean;
  errors: string[];
}

/** Field-level validation used to highlight rows and gate import. */
export function validateDraft(d: DraftTransaction): RowValidation {
  const errors: string[] = [];
  if (!d.occurredOn) errors.push('Invalid or missing date');
  if (!Number.isFinite(d.amountOriginal) || d.amountOriginal <= 0) errors.push('Invalid amount');
  if (!/^[A-Z]{3}$/.test(d.currencyOriginal)) errors.push('Invalid currency code');
  if (!Number.isFinite(d.exchangeRate) || d.exchangeRate <= 0) errors.push('Invalid exchange rate');
  return { valid: errors.length === 0, errors };
}

/** Base-currency amount for a draft (derived; frozen only at import time). */
export function draftBaseAmount(d: DraftTransaction): number {
  if (!Number.isFinite(d.amountOriginal) || !Number.isFinite(d.exchangeRate)) return NaN;
  return toBaseAmount(d.amountOriginal, d.exchangeRate);
}
