/**
 * Email links (magic link, password reset, sign-up confirmation) land on
 * /auth/confirm with a one-time `token_hash` (see supabase/templates/). The
 * app verifies it itself, so a link works in any browser or device, not only
 * the one that asked for it.
 */
export type AuthLinkType = 'email' | 'recovery';

export interface AuthLink {
  tokenHash: string;
  type: AuthLinkType;
}

/** Link types the templates send, mapped to what `verifyOtp` should be called with. */
const LINK_TYPES = new Map<string, AuthLinkType>([
  ['magiclink', 'email'],
  ['signup', 'email'],
  ['email', 'email'],
  ['recovery', 'recovery'],
]);

export function parseAuthLink(search: string): AuthLink | null {
  const params = new URLSearchParams(search);
  const tokenHash = params.get('token_hash');
  const type = LINK_TYPES.get(params.get('type') ?? '');
  if (!tokenHash || !type) return null;
  return { tokenHash, type };
}

/**
 * True when the address shows an email link that didn't sign anyone in:
 * Supabase's error for an expired or already-used link, or a sign-in `code`
 * left unexchanged because it was opened in a different browser.
 */
export function failedAuthLink(search: string, hash: string): boolean {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  return query.has('error_code') || fragment.has('error_code') || query.has('code');
}

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const RECOVERY_KEY = 'mony:password-recovery';

function tabStorage(): KeyValueStorage | undefined {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

/**
 * A reset-link session must choose a new password before using the app. The
 * flag is kept per tab (sessionStorage) so a reload can't skip that step.
 */
export function rememberRecovery(userId: string, storage = tabStorage()): void {
  try {
    storage?.setItem(RECOVERY_KEY, userId);
  } catch {
    // Storage blocked: the in-memory flag still covers this page load.
  }
}

export function isRecovering(userId: string | null, storage = tabStorage()): boolean {
  if (!userId) return false;
  try {
    return storage?.getItem(RECOVERY_KEY) === userId;
  } catch {
    return false;
  }
}

export function clearRecovery(storage = tabStorage()): void {
  try {
    storage?.removeItem(RECOVERY_KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
}
