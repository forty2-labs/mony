import { supabase } from '@/shared/lib/supabase';
import type { ProfileRow } from '@/shared/types/database';

/** Columns a user may change (column-level UPDATE grants enforce the same list). */
export type ProfilePatch = Partial<
  Pick<ProfileRow, 'display_name' | 'inactivity_timeout_minutes' | 'internal_transfer_names'>
>;

/** The signed-in user's profile. RLS restricts the table to the caller's own row. */
export async function getProfile(): Promise<ProfileRow> {
  const { data, error } = await supabase.from('profiles').select('*').single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, patch: ProfilePatch): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/** Normalise free-text names into the stored form: trimmed, lower-cased, unique. */
export function normaliseTransferNames(input: string): string[] {
  const names = input
    .split(',')
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(names)].slice(0, 20);
}
