/**
 * Compute the base-currency amount from an original amount and a frozen FX rate.
 * Rounded to 2dp to match the numeric(14,2) storage. The rate is "original ->
 * base" (e.g. USD->GBP), so base = original * rate.
 */
export function toBaseAmount(amountOriginal: number, exchangeRate: number): number {
  return Math.round(amountOriginal * exchangeRate * 100) / 100;
}

/** Round any monetary value to 2dp. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
