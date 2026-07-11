import { createClient } from '@supabase/supabase-js';

import type { Database } from '../types/database';
import { env } from './env';

/**
 * The single Supabase client for the app.
 *
 * Security notes:
 *  - Only the anon (public, RLS-gated) key is used here. Row Level Security on
 *    every table is what actually protects the data; the key alone grants
 *    nothing without an authenticated session.
 *  - Sessions are persisted and auto-refreshed so the app survives reloads and
 *    works toward offline-first behaviour in later phases.
 */
export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'vault.auth',
  },
});
