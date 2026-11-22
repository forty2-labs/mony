import { describe, expect, it } from 'vitest';

import {
  clearRecovery,
  failedAuthLink,
  isRecovering,
  parseAuthLink,
  rememberRecovery,
} from './authLink';

describe('parseAuthLink', () => {
  it('reads a recovery link', () => {
    expect(parseAuthLink('?token_hash=abc123&type=recovery')).toEqual({
      tokenHash: 'abc123',
      type: 'recovery',
    });
  });

  it('treats magic-link and sign-up confirmation links as email links', () => {
    for (const type of ['magiclink', 'signup', 'email']) {
      expect(parseAuthLink(`?token_hash=abc123&type=${type}`)).toEqual({
        tokenHash: 'abc123',
        type: 'email',
      });
    }
  });

  it('rejects links without a token or with an unknown type', () => {
    expect(parseAuthLink('')).toBeNull();
    expect(parseAuthLink('?type=recovery')).toBeNull();
    expect(parseAuthLink('?token_hash=abc123')).toBeNull();
    expect(parseAuthLink('?token_hash=abc123&type=invite')).toBeNull();
    expect(parseAuthLink('?token_hash=abc123&type=toString')).toBeNull();
  });
});

describe('failedAuthLink', () => {
  it('spots the error Supabase appends to an expired or used link', () => {
    expect(
      failedAuthLink(
        '?error=access_denied&error_code=otp_expired',
        '#error=access_denied&error_code=otp_expired',
      ),
    ).toBe(true);
    expect(failedAuthLink('', '#error=access_denied&error_code=otp_expired')).toBe(true);
  });

  it('spots a sign-in code that was never exchanged (opened in another browser)', () => {
    expect(failedAuthLink('?code=cf3a43f5', '')).toBe(true);
  });

  it('ignores ordinary addresses', () => {
    expect(failedAuthLink('', '')).toBe(false);
    expect(failedAuthLink('?mode=signup', '#pricing')).toBe(false);
  });
});

describe('recovery memory', () => {
  const fakeStorage = () => {
    const data = new Map<string, string>();
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
  };

  it('remembers which user is mid-reset, across reloads of the same tab', () => {
    const storage = fakeStorage();
    rememberRecovery('user-1', storage);
    expect(isRecovering('user-1', storage)).toBe(true);
    expect(isRecovering('user-2', storage)).toBe(false);
    expect(isRecovering(null, storage)).toBe(false);
    clearRecovery(storage);
    expect(isRecovering('user-1', storage)).toBe(false);
  });

  it('never throws when storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(() => rememberRecovery('user-1', blocked)).not.toThrow();
    expect(isRecovering('user-1', blocked)).toBe(false);
    expect(() => clearRecovery(blocked)).not.toThrow();
  });
});
