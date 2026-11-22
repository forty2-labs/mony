/**
 * Whether this is the shared demo account. Read from `app_metadata.demo`, which
 * only the server can set (supabase/seed.sql), never from user_metadata, which
 * the signed-in user can edit. The delete-account Edge Function enforces the
 * same rule; this only shapes the UI.
 */
export function isDemoAccount(
  user: { app_metadata?: Record<string, unknown>; user_metadata?: unknown } | null | undefined,
): boolean {
  return user?.app_metadata?.demo === true;
}
