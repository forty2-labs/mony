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
 * Record a repayment (in base currency). The database applies it atomically:
 * it adds to amount_repaid_base (capped at the loan amount) and derives the new
 * status, so concurrent repayments can't overwrite each other.
 */
export async function recordRepayment(id: string, amountBase: number): Promise<LoanRow> {
  const { data, error } = await supabase.rpc('record_loan_repayment', {
    p_loan_id: id,
    p_amount_base: amountBase,
  });
  if (error) throw error;
  return data;
}

export async function deleteLoan(id: string): Promise<void> {
  const { error } = await supabase.from('loans').delete().eq('id', id);
  if (error) throw error;
}
