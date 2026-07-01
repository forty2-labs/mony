import { supabase } from '@/shared/lib/supabase';
import type { CategoryRow } from '@/shared/types/database';

export type CategoryKind = 'expense' | 'income';

export interface CategoryInput {
  name: string;
  kind: CategoryKind;
  color?: string | null;
  icon?: string | null;
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Not authenticated');
  return id;
}

export async function listCategories(includeArchived = false): Promise<CategoryRow[]> {
  let query = supabase.from('categories').select('*').order('name');
  if (!includeArchived) query = query.eq('is_archived', false);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createCategory(input: CategoryInput): Promise<CategoryRow> {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from('categories')
    .insert({ ...input, user_id })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(
  id: string,
  patch: Partial<CategoryInput> & { is_archived?: boolean },
): Promise<CategoryRow> {
  const { data, error } = await supabase
    .from('categories')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
