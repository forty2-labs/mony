export type Mode = 'signin' | 'signup' | 'otp' | 'forgot';

const MODES: readonly Mode[] = ['signin', 'signup', 'otp', 'forgot'];

/**
 * The login form to open for a `?mode=` value. Only the known modes count, so a
 * crafted value (including names like "toString" that every object inherits)
 * can't put the form into a state it has no copy for.
 */
export function loginModeFrom(value: string | null): Mode {
  return MODES.find((m) => m === value) ?? 'signin';
}
