import { z } from 'zod';

/**
 * Centralised, validated access to environment configuration.
 *
 * We fail loudly at startup if required values are missing, rather than letting
 * an undefined Supabase URL surface as a confusing runtime error later.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
  VITE_BASE_CURRENCY: z.string().length(3).default('GBP'),
  VITE_INACTIVITY_TIMEOUT_MINUTES: z.coerce.number().int().min(0).default(30),
  // Comma-separated names/handles that identify a transfer between your own
  // accounts (e.g. your own name as the counterparty). Imported rows whose
  // description contains any of these are pre-deselected in the review modal.
  VITE_INTERNAL_TRANSFER_NAMES: z.string().default(''),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(
    `Invalid environment configuration. Did you copy .env.local.example to .env.local?\n${issues}`,
  );
}

export const env = parsed.data;

export const BASE_CURRENCY = env.VITE_BASE_CURRENCY;
export const INACTIVITY_TIMEOUT_MS = env.VITE_INACTIVITY_TIMEOUT_MINUTES * 60_000;

/** Lower-cased names used to detect transfers between the user's own accounts. */
export const INTERNAL_TRANSFER_NAMES = env.VITE_INTERNAL_TRANSFER_NAMES.split(',')
  .map((n) => n.trim().toLowerCase())
  .filter(Boolean);
