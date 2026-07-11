import { supabase } from '@/shared/lib/supabase';
import type { IncomeRow } from '@/shared/types/database';

export interface IncomeCategoryRef {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

export interface IncomeWithCategory extends IncomeRow {
  category: IncomeCategoryRef | null;
}

export interface IncomeFilters {
  search?: string;
  categoryId?: string | null;
  currency?: string | null;
  from?: string | null;
  to?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  sort?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

export interface IncomeInput {
  category_id: string | null;
  amount_original: number;
  currency_original: string;
  exchange_rate: number;
  amount_base: number;
  occurred_on: string;
  notes: string | null;
}

const SELECT = '*, category:categories(id, name, color, icon)';

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Not authenticated');
  return id;
}

export async function listIncome(
  filters: IncomeFilters = {},
): Promise<IncomeWithCategory[]> {
  let q = supabase.from('income').select(SELECT).is('deleted_at', null);

  if (filters.categoryId) q = q.eq('category_id', filters.categoryId);
  if (filters.currency) q = q.eq('currency_original', filters.currency);
  if (filters.from) q = q.gte('occurred_on', filters.from);
  if (filters.to) q = q.lte('occurred_on', filters.to);
  if (filters.minAmount != null) q = q.gte('amount_base', filters.minAmount);
  if (filters.maxAmount != null) q = q.lte('amount_base', filters.maxAmount);
  if (filters.search) q = q.ilike('notes', `%${filters.search}%`);

  switch (filters.sort ?? 'date_desc') {
    case 'date_asc':
      q = q.order('occurred_on', { ascending: true });
      break;
    case 'amount_desc':
      q = q.order('amount_base', { ascending: false });
      break;
    case 'amount_asc':
      q = q.order('amount_base', { ascending: true });
      break;
    default:
      q = q.order('occurred_on', { ascending: false }).order('created_at', {
        ascending: false,
      });
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as IncomeWithCategory[];
}

export async function createIncome(input: IncomeInput): Promise<IncomeRow> {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from('income')
    .insert({ ...input, user_id })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateIncome(
  id: string,
  patch: Partial<IncomeInput>,
): Promise<IncomeRow> {
  const { data, error } = await supabase
    .from('income')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteIncome(id: string): Promise<void> {
  const { error } = await supabase
    .from('income')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
