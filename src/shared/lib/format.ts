import { BASE_CURRENCY } from './env';

/** Format a number as currency in the app's base currency (default GBP). */
export function formatMoney(amount: number, currency = BASE_CURRENCY): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Short, human date e.g. "28 Jun 2026". */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}
