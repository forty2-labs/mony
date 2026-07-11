import { supabase } from '@/shared/lib/supabase';
import type { BillingCycle, SubscriptionRow } from '@/shared/types/database';

export interface SubscriptionInput {
  name: string;
  cost_original: number;
  currency_original: string;
  exchange_rate: number;
  cost_base: number;
  billing_cycle: BillingCycle;
  next_payment_date: string | null;
  is_active: boolean;
}

/** Convert a per-cycle base cost into its monthly equivalent. */
export function monthlyEquivalent(costBase: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return (costBase * 52) / 12;
    case 'monthly':
      return costBase;
    case 'quarterly':
      return costBase / 3;
    case 'yearly':
      return costBase / 12;
  }
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Not authenticated');
  return id;
}

export async function listSubscriptions(): Promise<SubscriptionRow[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('is_active', { ascending: false })
    .order('next_payment_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSubscription(input: SubscriptionInput): Promise<SubscriptionRow> {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({ ...input, user_id })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateSubscription(
  id: string,
  patch: Partial<SubscriptionInput>,
): Promise<SubscriptionRow> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase.from('subscriptions').delete().eq('id', id);
  if (error) throw error;
}
