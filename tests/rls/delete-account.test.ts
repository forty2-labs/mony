/**
 * The delete-account Edge Function: only the caller can be deleted, the typed
 * confirmation must match, and every row the user owned is removed with them.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  adminClient,
  anonClient,
  createUser,
  deleteUser,
  type LocalStack,
  localStack,
  money,
  type TestUser,
} from './helpers';

const OWNED_TABLES = [
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

let stack: LocalStack;
let victim: TestUser;
let bystander: TestUser;

beforeAll(async () => {
  stack = localStack();
  victim = await createUser(stack, 'leaving');
  bystander = await createUser(stack, 'staying');
  for (const user of [victim, bystander]) {
    await user.client.from('expenses').insert({ ...money(), occurred_on: '2026-03-01' });
    await user.client.from('savings_goals').insert({ name: 'Goal', target_amount_base: 50 });
  }
});

afterAll(async () => {
  await deleteUser(stack, victim.id).catch(() => {});
  await deleteUser(stack, bystander.id).catch(() => {});
});

const invoke = (user: TestUser | null, body: Record<string, unknown>) =>
  (user?.client ?? anonClient(stack)).functions.invoke('delete-account', { body });

async function statusOf(result: Awaited<ReturnType<typeof invoke>>) {
  const res = (result.error as { context?: Response } | null)?.context;
  return res ? { status: res.status, body: await res.json() } : { status: 200, body: result.data };
}

async function rowCount(userId: string) {
  const admin = adminClient(stack);
  let total = 0;
  for (const table of OWNED_TABLES) {
    const { count } = await admin
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    total += count ?? 0;
  }
  const { count: profiles } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('id', userId);
  return total + (profiles ?? 0);
}

describe('delete-account', () => {
  it('rejects unauthenticated calls', async () => {
    const { status } = await statusOf(await invoke(null, { confirmEmail: victim.email }));
    expect(status).toBe(401);
  });

  it('rejects a confirmation that doesn’t match the caller', async () => {
    // Typing someone else's email must not delete them, or the caller.
    const { status, body } = await statusOf(
      await invoke(victim, { confirmEmail: bystander.email }),
    );
    expect(status).toBe(400);
    expect(body.error).toBe('confirmation_mismatch');
    expect(await rowCount(victim.id)).toBeGreaterThan(0);
    expect(await rowCount(bystander.id)).toBeGreaterThan(0);
  });

  it('deletes the caller and every row they owned, and nobody else', async () => {
    const bystanderRows = await rowCount(bystander.id);
    const { status, body } = await statusOf(
      await invoke(victim, { confirmEmail: victim.email.toUpperCase() }),
    );
    expect(status).toBe(200);
    expect(body).toEqual({ deleted: true });

    expect(await rowCount(victim.id)).toBe(0);
    const { data } = await adminClient(stack).auth.admin.getUserById(victim.id);
    expect(data.user).toBeNull();
    expect(await rowCount(bystander.id)).toBe(bystanderRows);
  });
});
