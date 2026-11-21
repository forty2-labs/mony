import { fetchAll } from '@/shared/lib/fetchAll';
import { supabase } from '@/shared/lib/supabase';

/** Every user-owned table, in the order they appear in the export file. */
const EXPORT_TABLES = [
  'categories',
  'expenses',
  'income',
  'budgets',
  'savings_goals',
  'loans',
  'subscriptions',
  'exchange_rates',
  'audit_logs',
] as const;

/**
 * Build a complete, machine-readable copy of the signed-in user's data (UK GDPR
 * right of access / portability). RLS limits every read to the caller's rows,
 * and each table is paged so nothing is truncated by the API row cap.
 * Soft-deleted transactions are included and marked by `deleted_at`.
 */
export async function exportAllData(): Promise<Blob> {
  const { data: profile, error } = await supabase.from('profiles').select('*').single();
  if (error) throw error;

  const tables: Record<string, unknown[]> = {};
  for (const table of EXPORT_TABLES) {
    tables[table] = await fetchAll((from, to) =>
      supabase.from(table).select('*').order('id').range(from, to),
    );
  }

  const payload = {
    format: 'mony-export',
    version: 1,
    exported_at: new Date().toISOString(),
    profile,
    ...tables,
  };
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type DeleteAccountResult = 'deleted' | 'reauthenticate' | 'mismatch';

/**
 * Ask the server to permanently delete this account and all of its data. The
 * caller is identified by their session token; `confirmEmail` must match it.
 */
export async function deleteAccount(confirmEmail: string): Promise<DeleteAccountResult> {
  const { data, error } = await supabase.functions.invoke<{ deleted?: boolean; error?: string }>(
    'delete-account',
    { body: { confirmEmail } },
  );
  if (error) {
    // FunctionsHttpError carries the response; read our error code from it.
    const res = (error as { context?: Response }).context;
    const body = res ? ((await res.json().catch(() => null)) as { error?: string } | null) : null;
    if (body?.error === 'reauthentication_required') return 'reauthenticate';
    if (body?.error === 'confirmation_mismatch') return 'mismatch';
    throw new Error('We couldn’t delete your account. Please try again.');
  }
  if (!data?.deleted) throw new Error('We couldn’t delete your account. Please try again.');
  return 'deleted';
}
