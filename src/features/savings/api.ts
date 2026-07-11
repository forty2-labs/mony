import { supabase } from '@/shared/lib/supabase';
import type { SavingsGoalRow } from '@/shared/types/database';

export interface SavingsGoalInput {
  name: string;
  target_amount_base: number;
  current_amount_base: number;
  deadline: string | null;
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Not authenticated');
  return id;
}

export async function listGoals(): Promise<SavingsGoalRow[]> {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createGoal(input: SavingsGoalInput): Promise<SavingsGoalRow> {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from('savings_goals')
    .insert({ ...input, user_id })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateGoal(
  id: string,
  patch: Partial<SavingsGoalInput>,
): Promise<SavingsGoalRow> {
  const { data, error } = await supabase
    .from('savings_goals')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Add (or, with a negative delta, withdraw) funds from a goal. Reads the current
 * balance then writes the clamped result — a goal can't go below zero.
 */
export async function contribute(id: string, delta: number): Promise<SavingsGoalRow> {
  const { data: row, error: readErr } = await supabase
    .from('savings_goals')
    .select('current_amount_base')
    .eq('id', id)
    .single();
  if (readErr) throw readErr;
  const next = Math.max(0, Number(row.current_amount_base) + delta);
  return updateGoal(id, { current_amount_base: next });
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('savings_goals').delete().eq('id', id);
  if (error) throw error;
}
