/**
 * Client-side mirror of the server's password policy (supabase/config.toml:
 * minimum_password_length = 10, password_requirements = lower_upper_letters_digits).
 * The server is the authority; this only gives earlier, clearer feedback.
 */
export const MIN_PASSWORD_LENGTH = 10;

export const PASSWORD_HINT = `At least ${MIN_PASSWORD_LENGTH} characters, with upper- and lower-case letters and a number.`;

/** Returns a message describing what's wrong, or `true` when the password is acceptable. */
export function passwordProblem(password: string): string | true {
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  if (!/[a-z]/.test(password)) return 'Add a lower-case letter';
  if (!/[A-Z]/.test(password)) return 'Add an upper-case letter';
  if (!/\d/.test(password)) return 'Add a number';
  return true;
}

/**
 * Map Supabase Auth errors to user-facing copy. Unknown errors get a generic
 * message so internal details never reach the screen.
 */
export function friendlyAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  const code = (err as { code?: string } | null)?.code ?? '';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message))
    return 'That email and password don’t match. Try again or reset your password.';
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(message))
    return 'Please confirm your email first — check your inbox for the link.';
  if (code === 'weak_password' || /password/i.test(message)) return message;
  if (
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit' ||
    /rate limit/i.test(message)
  )
    return 'Too many attempts. Please wait a few minutes and try again.';
  if (code === 'otp_disabled' || /signups not allowed/i.test(message))
    return 'If an account exists for that email, a sign-in link is on its way.';
  return 'Something went wrong. Please try again.';
}
