import { describe, expect, it } from 'vitest';

import { loginModeFrom } from './loginMode';

describe('loginModeFrom', () => {
  it('accepts the known modes', () => {
    expect(loginModeFrom('signup')).toBe('signup');
    expect(loginModeFrom('otp')).toBe('otp');
    expect(loginModeFrom('forgot')).toBe('forgot');
  });

  it('falls back to sign-in for missing or unknown values', () => {
    expect(loginModeFrom(null)).toBe('signin');
    expect(loginModeFrom('admin')).toBe('signin');
  });

  it('ignores names inherited from Object.prototype', () => {
    expect(loginModeFrom('toString')).toBe('signin');
    expect(loginModeFrom('constructor')).toBe('signin');
  });
});
