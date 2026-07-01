import { BASE_CURRENCY } from '@/shared/lib/env';
import { supabase } from '@/shared/lib/supabase';

/**
 * Exchange-rate sourcing for transaction entry.
 *
 * Strategy (see the project decision on FX handling):
 *  - Auto-fetch the rate as-of the transaction date from Frankfurter (free, no
 *    key, ECB data), so historical entries get the historically-correct rate.
 *  - Cache successful lookups in the user-scoped `exchange_rates` table to avoid
 *    repeat network calls and to keep a local audit of what we used.
 *  - The caller can always override the returned rate; whatever is saved on the
 *    row is frozen forever.
 *  - Never throw to the UI: on any failure return null so the form falls back to
 *    manual entry (preserving the local-first promise).
 */

const FRANKFURTER = 'https://api.frankfurter.app';

export interface RateResult {
  rate: number;
  source: 'identity' | 'cache' | 'api';
}

function isoDate(date: string): string {
  // Accepts "YYYY-MM-DD" or a full date string; normalise to YYYY-MM-DD.
  return date.length >= 10 ? date.slice(0, 10) : date;
}

async function readCache(from: string, to: string, asOf: string): Promise<number | null> {
  const { data } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('base_currency', from)
    .eq('quote_currency', to)
    .eq('as_of', asOf)
    .maybeSingle();
  return data?.rate ?? null;
}

async function writeCache(from: string, to: string, asOf: string, rate: number) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;
  await supabase
    .from('exchange_rates')
    .upsert(
      { user_id: userId, base_currency: from, quote_currency: to, rate, as_of: asOf },
      { onConflict: 'user_id,base_currency,quote_currency,as_of' },
    );
}

/**
 * Resolve the rate to convert `from` currency into the app base currency,
 * as of `date`. Returns null only when both cache and network fail.
 */
export async function fetchRateToBase(
  from: string,
  date: string,
  to: string = BASE_CURRENCY,
): Promise<RateResult | null> {
  if (from === to) return { rate: 1, source: 'identity' };

  const asOf = isoDate(date);

  const cached = await readCache(from, to, asOf).catch(() => null);
  if (cached != null) return { rate: cached, source: 'cache' };

  try {
    const res = await fetch(`${FRANKFURTER}/${asOf}?from=${from}&to=${to}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { rates?: Record<string, number> };
    const rate = json.rates?.[to];
    if (typeof rate !== 'number') return null;
    // Best-effort cache; don't block the result on it.
    void writeCache(from, to, asOf, rate).catch(() => {});
    return { rate, source: 'api' };
  } catch {
    return null;
  }
}
