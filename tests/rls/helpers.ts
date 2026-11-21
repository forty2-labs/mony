import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface LocalStack {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

/**
 * Connection details for the LOCAL Supabase stack only. Values come from
 * `supabase status`, so these tests can never be pointed at a hosted project by
 * accident; the URL is checked to be loopback as a second guard.
 */
export function localStack(): LocalStack {
  const out = execSync('npx supabase status -o env', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const vars = Object.fromEntries(
    out
      .split('\n')
      .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter((m): m is RegExpMatchArray => !!m)
      .map((m) => [m[1], m[2]]),
  );
  const url = vars.API_URL;
  if (!url || !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url)) {
    throw new Error(
      `Refusing to run isolation tests against a non-local API (${url ?? 'none'}). Run \`npm run db:start\`.`,
    );
  }
  return { url, anonKey: vars.ANON_KEY, serviceRoleKey: vars.SERVICE_ROLE_KEY };
}

const noPersist = { auth: { persistSession: false, autoRefreshToken: false } } as const;

export function adminClient(stack: LocalStack): SupabaseClient {
  return createClient(stack.url, stack.serviceRoleKey, noPersist);
}

export function anonClient(stack: LocalStack): SupabaseClient {
  return createClient(stack.url, stack.anonKey, noPersist);
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient;
}

/** Create a confirmed user via the admin API and return a signed-in client for them. */
export async function createUser(stack: LocalStack, label: string): Promise<TestUser> {
  const email = `${label}-${randomUUID()}@example.test`;
  const password = `Pw-${randomUUID()}-Aa1`;
  const admin = adminClient(stack);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('createUser failed');

  const client = anonClient(stack);
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id: data.user.id, email, password, client };
}

export async function deleteUser(stack: LocalStack, id: string): Promise<void> {
  await adminClient(stack).auth.admin.deleteUser(id);
}

/** A money row that satisfies every CHECK constraint. */
export const money = (amount = 12.34) => ({
  amount_original: amount,
  currency_original: 'GBP',
  exchange_rate: 1,
  amount_base: amount,
});
