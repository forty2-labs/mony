/**
 * Cross-user isolation: user B attacks user A's data through the public API,
 * the same way a malicious client could, with real IDs, forged user_ids and
 * forged foreign keys. Every attempt must fail at the database, not the UI.
 *
 * Requires the local stack: `npm run db:start`, then `npm run test:rls`.
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

type Table =
  | 'categories'
  | 'expenses'
  | 'income'
  | 'budgets'
  | 'savings_goals'
  | 'loans'
  | 'subscriptions'
  | 'exchange_rates';

const USER_TABLES: Table[] = [
  'categories',
  'expenses',
  'income',
  'budgets',
  'savings_goals',
  'loans',
  'subscriptions',
  'exchange_rates',
];

/** A harmless edit per table that B will try to apply to A's row. */
const TAMPER: Record<Table, Record<string, unknown>> = {
  categories: { name: 'pwned' },
  expenses: { notes: 'pwned' },
  income: { notes: 'pwned' },
  budgets: { amount_base: 1 },
  savings_goals: { name: 'pwned' },
  loans: { person_name: 'pwned' },
  subscriptions: { name: 'pwned' },
  exchange_rates: { rate: 9 },
};

let stack: LocalStack;
let a: TestUser;
let b: TestUser;
/** IDs of A's rows, keyed by table. */
const aRows = {} as Record<Table, string>;
let aExpenseCategory: string;
let aIncomeCategory: string;
let bExpenseCategory: string;

beforeAll(async () => {
  stack = localStack();
  a = await createUser(stack, 'alice');
  b = await createUser(stack, 'bob');

  // Sign-up trigger seeds default categories for each user.
  const { data: aCats } = await a.client.from('categories').select('id, name, kind');
  aExpenseCategory = aCats!.find((c) => c.name === 'Groceries')!.id;
  aIncomeCategory = aCats!.find((c) => c.name === 'Salary')!.id;
  const { data: bCats } = await b.client.from('categories').select('id, name');
  bExpenseCategory = bCats!.find((c) => c.name === 'Groceries')!.id;
  aRows.categories = aExpenseCategory;

  // A creates one row in every table, through their own client (owner CRUD works).
  const insert = async (table: Table, row: Record<string, unknown>) => {
    // user_id is explicit here so the suite also runs (and fails loudly) against
    // an older schema without the auth.uid() default.
    const { data, error } = await a.client
      .from(table)
      .insert({ ...row, user_id: a.id })
      .select('id')
      .single();
    if (error) throw new Error(`seed ${table}: ${error.message}`);
    aRows[table] = data.id;
  };
  await insert('expenses', {
    ...money(42),
    category_id: aExpenseCategory,
    occurred_on: '2026-01-15',
    notes: 'A only',
  });
  await insert('income', {
    ...money(1000),
    category_id: aIncomeCategory,
    occurred_on: '2026-01-01',
  });
  await insert('budgets', {
    category_id: aExpenseCategory,
    period_month: '2026-01-01',
    amount_base: 300,
  });
  await insert('savings_goals', { name: 'A goal', target_amount_base: 1000 });
  await insert('loans', { ...money(100), person_name: 'Someone' });
  await insert('subscriptions', {
    name: 'A sub',
    cost_original: 10,
    currency_original: 'GBP',
    exchange_rate: 1,
    cost_base: 10,
  });
  await insert('exchange_rates', {
    base_currency: 'EUR',
    quote_currency: 'GBP',
    rate: 0.85,
    as_of: '2026-01-15',
  });
});

afterAll(async () => {
  if (a) await deleteUser(stack, a.id);
  if (b) await deleteUser(stack, b.id);
});

/** Read A's row with the service role (bypasses RLS) to check it's intact. */
async function aRowAsAdmin(table: Table) {
  const { data } = await adminClient(stack)
    .from(table)
    .select('*')
    .eq('id', aRows[table])
    .maybeSingle();
  return data as Record<string, unknown> | null;
}

describe.each(USER_TABLES)('%s: B cannot reach A’s row by ID', (table) => {
  it('cannot read it', async () => {
    const { data, error } = await b.client.from(table).select('*').eq('id', aRows[table]);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('cannot update it', async () => {
    const before = await aRowAsAdmin(table);
    const { data } = await b.client
      .from(table)
      .update(TAMPER[table])
      .eq('id', aRows[table])
      .select();
    expect(data ?? []).toEqual([]);
    expect(await aRowAsAdmin(table)).toEqual(before);
  });

  it('cannot delete it', async () => {
    const { data } = await b.client.from(table).delete().eq('id', aRows[table]).select();
    expect(data ?? []).toEqual([]);
    expect(await aRowAsAdmin(table)).not.toBeNull();
  });

  it('cannot see it in an unfiltered list', async () => {
    const { data } = await b.client.from(table).select('id');
    expect((data ?? []).map((r) => r.id)).not.toContain(aRows[table]);
  });
});

describe('forged ownership', () => {
  it('B cannot insert a row owned by A', async () => {
    const { error } = await b.client
      .from('expenses')
      .insert({ ...money(), user_id: a.id, occurred_on: '2026-01-02' });
    expect(error?.code).toBe('42501');
  });

  it('B cannot move their own row to A', async () => {
    const { data } = await b.client
      .from('expenses')
      .insert({ ...money(), occurred_on: '2026-01-02' })
      .select('id')
      .single();
    const { error } = await b.client.from('expenses').update({ user_id: a.id }).eq('id', data!.id);
    expect(error?.code).toBe('42501');
  });

  it('user_id defaults to the caller when omitted', async () => {
    const { data, error } = await b.client
      .from('expenses')
      .insert({ ...money(), occurred_on: '2026-01-03' })
      .select('user_id')
      .single();
    expect(error).toBeNull();
    expect(data!.user_id).toBe(b.id);
  });
});

describe('forged foreign keys (FK checks bypass RLS, so the schema must block these)', () => {
  it.each([
    ['expenses', () => ({ ...money(), occurred_on: '2026-01-04', category_id: aExpenseCategory })],
    ['income', () => ({ ...money(), occurred_on: '2026-01-04', category_id: aIncomeCategory })],
    [
      'budgets',
      () => ({ period_month: '2026-02-01', amount_base: 10, category_id: aExpenseCategory }),
    ],
  ] as const)('B cannot attach a %s row to A’s category', async (table, row) => {
    const { error } = await b.client.from(table).insert(row() as Record<string, unknown>);
    expect(error?.code).toBe('23503');
  });

  it('B cannot re-point an existing row at A’s category', async () => {
    const { data } = await b.client
      .from('expenses')
      .insert({ ...money(), occurred_on: '2026-01-05', category_id: bExpenseCategory })
      .select('id')
      .single();
    const { error } = await b.client
      .from('expenses')
      .update({ category_id: aExpenseCategory })
      .eq('id', data!.id);
    expect(error?.code).toBe('23503');
  });
});

describe('RPCs respect ownership', () => {
  it('B cannot record a repayment on A’s loan', async () => {
    const before = await aRowAsAdmin('loans');
    const { error } = await b.client.rpc('record_loan_repayment', {
      p_loan_id: aRows.loans,
      p_amount_base: 50,
    });
    expect(error).not.toBeNull();
    expect(await aRowAsAdmin('loans')).toEqual(before);
  });

  it('B cannot move money in A’s savings goal', async () => {
    const before = await aRowAsAdmin('savings_goals');
    const { error } = await b.client.rpc('contribute_to_goal', {
      p_goal_id: aRows.savings_goals,
      p_delta: 500,
    });
    expect(error).not.toBeNull();
    expect(await aRowAsAdmin('savings_goals')).toEqual(before);
  });

  it('A’s own repayment applies atomically and derives the status', async () => {
    const { data, error } = await a.client.rpc('record_loan_repayment', {
      p_loan_id: aRows.loans,
      p_amount_base: 40,
    });
    expect(error).toBeNull();
    expect(Number(data.amount_repaid_base)).toBe(40);
    expect(data.status).toBe('partially_repaid');
  });

  it('account_balance only sums the caller’s rows', async () => {
    const { data: aBal } = await a.client.rpc('account_balance');
    const { data: bBal } = await b.client.rpc('account_balance');
    expect(Number(aBal)).toBe(1000 - 42);
    // B has only the small test expenses created above, never A's income.
    expect(Number(bBal)).toBeLessThan(0);
  });
});

describe('profiles', () => {
  it('B sees only their own profile', async () => {
    const { data } = await b.client.from('profiles').select('id');
    expect(data).toEqual([{ id: b.id }]);
  });

  it('B cannot update A’s profile', async () => {
    const { data } = await b.client
      .from('profiles')
      .update({ display_name: 'pwned' })
      .eq('id', a.id)
      .select();
    expect(data ?? []).toEqual([]);
    const { data: aProfile } = await a.client.from('profiles').select('display_name').single();
    expect(aProfile!.display_name).not.toBe('pwned');
  });

  it('B cannot rewrite their profile id', async () => {
    const { error } = await b.client.from('profiles').update({ id: a.id }).eq('id', b.id);
    expect(error?.code).toBe('42501');
  });

  it('B cannot create or delete profiles', async () => {
    const { error: insertError } = await b.client.from('profiles').insert({ id: b.id });
    expect(insertError?.code).toBe('42501');
    const { error: deleteError } = await b.client.from('profiles').delete().eq('id', b.id);
    expect(deleteError?.code).toBe('42501');
  });
});

describe('audit log', () => {
  it('clients cannot forge entries', async () => {
    // Even with their own user_id (which the old policy allowed), inserts are refused.
    const { error } = await b.client
      .from('audit_logs')
      .insert({ user_id: b.id, action: 'x', entity: 'y' });
    expect(error?.code).toBe('42501');
  });
});

describe('anonymous (signed-out) access', () => {
  it.each([...USER_TABLES, 'profiles', 'audit_logs'])(
    'anon gets nothing from %s',
    async (table) => {
      const { data, error } = await anonClient(stack).from(table).select('*');
      // Either a permission error or an empty set is acceptable; data must never leak.
      expect(error ? [] : data).toEqual([]);
    },
  );

  it('anon cannot call RPCs', async () => {
    const { error } = await anonClient(stack).rpc('account_balance');
    expect(error).not.toBeNull();
  });
});

describe('database-level validation', () => {
  it('rejects oversized notes', async () => {
    const { error } = await b.client
      .from('expenses')
      .insert({ ...money(), occurred_on: '2026-01-06', notes: 'x'.repeat(1001) });
    expect(error?.code).toBe('23514');
  });

  it('rejects malformed currency codes', async () => {
    const { error } = await b.client
      .from('expenses')
      .insert({ ...money(), currency_original: 'gb1', occurred_on: '2026-01-06' });
    expect(error?.code).toBe('23514');
  });
});
