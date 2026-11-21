import { fetchAll } from '@/shared/lib/fetchAll';
import { supabase } from '@/shared/lib/supabase';
import type { BudgetRow } from '@/shared/types/database';

/** "YYYY-MM" -> the first-of-month date string budgets are keyed on. */
export function monthToPeriod(month: string): string {
  return `${month}-01`;
}

function monthBounds(month: string) {
  const [y, m] = month.split('-').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = `${y}-${pad(m)}-01`;
  const next = new Date(y, m, 1);
  const end = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-01`;
  return { start, end };
}

export interface BudgetInput {
  category_id: string;
  amount_base: number;
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Not authenticated');
  return id;
}

export async function listBudgets(month: string): Promise<BudgetRow[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('period_month', monthToPeriod(month));
  if (error) throw error;
  return data ?? [];
}

/** Sum of (non-deleted) expenses per category for the given month. */
export async function spendByCategory(month: string): Promise<Record<string, number>> {
  const { start, end } = monthBounds(month);
  const data = await fetchAll((from, to) =>
    supabase
      .from('expenses')
      .select('category_id, amount_base')
      .is('deleted_at', null)
      .gte('occurred_on', start)
      .lt('occurred_on', end)
      .order('id')
      .range(from, to),
  );
  const totals: Record<string, number> = {};
  for (const row of data) {
    if (!row.category_id) continue;
    totals[row.category_id] = (totals[row.category_id] ?? 0) + Number(row.amount_base);
  }
  return totals;
}

/** Create or update the budget for a category in a month (unique per those). */
export async function upsertBudget(month: string, input: BudgetInput): Promise<BudgetRow> {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      {
        user_id,
        category_id: input.category_id,
        period_month: monthToPeriod(month),
        amount_base: input.amount_base,
      },
      { onConflict: 'user_id,category_id,period_month' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}

/** Copy every budget from `fromMonth` into `toMonth` (upsert; overwrites clashes). */
export async function copyBudgets(fromMonth: string, toMonth: string): Promise<number> {
  const source = await listBudgets(fromMonth);
  if (source.length === 0) return 0;
  const user_id = await currentUserId();
  const rows = source.map((b) => ({
    user_id,
    category_id: b.category_id,
    period_month: monthToPeriod(toMonth),
    amount_base: Number(b.amount_base),
  }));
  const { error } = await supabase
    .from('budgets')
    .upsert(rows, { onConflict: 'user_id,category_id,period_month' });
  if (error) throw error;
  return rows.length;
}
