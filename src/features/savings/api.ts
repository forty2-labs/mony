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
 * Add (or, with a negative delta, withdraw) funds from a goal. The database
 * applies the change atomically and clamps the balance at zero.
 */
export async function contribute(id: string, delta: number): Promise<SavingsGoalRow> {
  const { data, error } = await supabase.rpc('contribute_to_goal', {
    p_goal_id: id,
    p_delta: delta,
  });
  if (error) throw error;
  return data;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('savings_goals').delete().eq('id', id);
  if (error) throw error;
}
