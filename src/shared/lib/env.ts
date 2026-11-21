import { z } from 'zod';

/**
 * Centralised, validated access to build-time configuration.
 *
 * Only values that are safe for every visitor to see belong here: they are
 * compiled into the public JS bundle. Per-user settings (auto-logout,
 * own-account transfer names) live in the `profiles` table instead.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(
    `Invalid environment configuration. Did you copy .env.local.example to .env.local?\n${issues}`,
  );
}

export const env = parsed.data;

/**
 * Base currency for every account. mony launches in the UK, so this is fixed
 * to GBP: every row's `amount_base` is frozen in it, so changing it per user
 * would need a re-conversion strategy for historical data.
 */
export const BASE_CURRENCY = 'GBP';

/** Default auto-logout, used until the user's profile has loaded. */
export const DEFAULT_INACTIVITY_TIMEOUT_MINUTES = 30;
