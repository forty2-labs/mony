import { supabase } from '@/shared/lib/supabase';
import type { LoanRow, LoanStatus } from '@/shared/types/database';

export interface LoanInput {
  person_name: string;
  amount_original: number;
  currency_original: string;
  exchange_rate: number;
  amount_base: number;
  expected_return_date: string | null;
  status: LoanStatus;
  notes: string | null;
}

export type LoanStatusFilter = 'all' | 'open' | LoanStatus;

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Not authenticated');
  return id;
}

export async function listLoans(filter: LoanStatusFilter = 'all'): Promise<LoanRow[]> {
  let q = supabase.from('loans').select('*').order('created_at', { ascending: false });
  if (filter === 'open') q = q.in('status', ['outstanding', 'partially_repaid']);
  else if (filter !== 'all') q = q.eq('status', filter);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createLoan(input: LoanInput): Promise<LoanRow> {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from('loans')
    .insert({ ...input, user_id })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateLoan(id: string, patch: Partial<LoanInput>): Promise<LoanRow> {
  const { data, error } = await supabase
    .from('loans')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Record a repayment (in base currency). Adds to amount_repaid_base and derives
 * the new status: fully covered -> repaid, some -> partially_repaid, none ->
 * outstanding. Never exceeds the loan's base amount.
 */
export async function recordRepayment(id: string, amountBase: number): Promise<LoanRow> {
  const { data: row, error: readErr } = await supabase
    .from('loans')
    .select('amount_base, amount_repaid_base, status')
    .eq('id', id)
    .single();
  if (readErr) throw readErr;

  const total = Number(row.amount_base);
  const repaid = Math.min(total, Number(row.amount_repaid_base) + amountBase);
  let status: LoanStatus = row.status as LoanStatus;
  if (status !== 'written_off') {
    if (repaid >= total && total > 0) status = 'repaid';
    else if (repaid > 0) status = 'partially_repaid';
    else status = 'outstanding';
  }

  const { data, error } = await supabase
    .from('loans')
    .update({ amount_repaid_base: repaid, status })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLoan(id: string): Promise<void> {
  const { error } = await supabase.from('loans').delete().eq('id', id);
  if (error) throw error;
}
