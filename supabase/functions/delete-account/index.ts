// Permanently delete the calling user's account and all of their data.
//
// This is the only operation in the app that needs the service-role key
// (auth.admin.deleteUser), so it runs here, server-side, never in the browser.
// Every table references auth.users with ON DELETE CASCADE, so deleting the auth
// user removes profiles, categories, transactions, budgets, loans, savings,
// subscriptions, cached FX rates and audit entries in one transaction.
//
// Safeguards:
//   * The caller is identified from their JWT only; the body can't name a user.
//   * The body must repeat the account's email (typed confirmation).
//   * The sign-in must be recent, so a stale or stolen session alone can't do it.
import { createClient } from 'npm:@supabase/supabase-js@2';

const RECENT_SIGN_IN_MS = 30 * 60_000;

const allowedOrigins = (
  Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

function json(req: Request, status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json(req, 405, { error: 'method_not_allowed' });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json(req, 401, { error: 'unauthorized' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Resolve the caller from their access token (validated by the Auth server).
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userError || !user) return json(req, 401, { error: 'unauthorized' });

  let confirmEmail = '';
  try {
    const body = (await req.json()) as { confirmEmail?: unknown };
    confirmEmail = typeof body.confirmEmail === 'string' ? body.confirmEmail : '';
  } catch {
    return json(req, 400, { error: 'invalid_body' });
  }
  if (!user.email || confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return json(req, 400, { error: 'confirmation_mismatch' });
  }

  const lastSignIn = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : 0;
  if (Date.now() - lastSignIn > RECENT_SIGN_IN_MS) {
    return json(req, 403, { error: 'reauthentication_required' });
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    // Log the failure without any user data or financial details.
    console.error('delete-account failed', { code: deleteError.code, status: deleteError.status });
    return json(req, 500, { error: 'delete_failed' });
  }

  return json(req, 200, { deleted: true });
});
