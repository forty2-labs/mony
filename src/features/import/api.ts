import type { ExpenseInput } from '@/features/expenses/api';
import type { IncomeInput } from '@/features/income/api';
import { supabase } from '@/shared/lib/supabase';

/** Supabase rejects very large single inserts; chunk to stay well under limits. */
const CHUNK_SIZE = 500;

export interface BulkImportPayload {
  expenses: ExpenseInput[];
  income: IncomeInput[];
}

export interface BulkImportResult {
  expenses: number;
  income: number;
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('Not authenticated');
  return id;
}

async function insertChunked(
  table: 'expenses' | 'income',
  rows: Record<string, unknown>[],
): Promise<void> {
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from(table).insert(chunk as never);
    if (error) throw error;
  }
}

/**
 * Insert reviewed expenses and income in one go. `user_id` is stamped here (RLS
 * requires it); every other field is already frozen by the review step.
 */
export async function bulkImport(payload: BulkImportPayload): Promise<BulkImportResult> {
  const user_id = await currentUserId();

  if (payload.expenses.length > 0) {
    await insertChunked(
      'expenses',
      payload.expenses.map((e) => ({ ...e, user_id })),
    );
  }
  if (payload.income.length > 0) {
    await insertChunked(
      'income',
      payload.income.map((i) => ({ ...i, user_id })),
    );
  }

  return { expenses: payload.expenses.length, income: payload.income.length };
}
