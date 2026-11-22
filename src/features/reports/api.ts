import { fetchAll } from '@/shared/lib/fetchAll';
import { supabase } from '@/shared/lib/supabase';

import {
  buildReport,
  type RangeSelection,
  type ReportData,
  type ReportRow,
  resolveRange,
} from './report';

export * from './report';

const EXP_SELECT =
  'id, amount_base, amount_original, currency_original, exchange_rate, occurred_on, notes, category:categories(name, color, icon)';
const INC_SELECT = EXP_SELECT;

export async function fetchReport(selection: RangeSelection): Promise<ReportData> {
  const range = resolveRange(selection);

  // Every read is paged: PostgREST caps each response at max_rows, so a single
  // request would silently drop rows (and skew every total) on larger ranges.
  const rowsIn = (table: 'expenses' | 'income', select: string, from: string, to: string) =>
    fetchAll((start, end) =>
      supabase
        .from(table)
        .select(select)
        .is('deleted_at', null)
        .gte('occurred_on', from)
        .lte('occurred_on', to)
        .order('occurred_on', { ascending: false })
        .order('id')
        .range(start, end),
    );

  const [expRows, incRows, prevExpRows, prevIncRows] = await Promise.all([
    rowsIn('expenses', EXP_SELECT, range.from, range.to),
    rowsIn('income', INC_SELECT, range.from, range.to),
    range.prev ? rowsIn('expenses', 'amount_base', range.prev.from, range.prev.to) : null,
    range.prev ? rowsIn('income', 'amount_base', range.prev.from, range.prev.to) : null,
  ]);

  const sumBase = (rows: unknown[]) =>
    (rows as { amount_base: number }[]).reduce((a, r) => a + Number(r.amount_base), 0);
  const prev =
    prevExpRows && prevIncRows
      ? { totalIncome: sumBase(prevIncRows), totalExpenses: sumBase(prevExpRows) }
      : undefined;

  return buildReport(
    range,
    expRows as unknown as ReportRow[],
    incRows as unknown as ReportRow[],
    prev,
  );
}
