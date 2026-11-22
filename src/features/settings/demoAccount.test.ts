import { describe, expect, it } from 'vitest';

import { isDemoAccount } from './demoAccount';

describe('isDemoAccount', () => {
  it('is true only for the server-set app_metadata flag', () => {
    expect(isDemoAccount({ app_metadata: { demo: true } })).toBe(true);
  });

  it('ignores a demo flag in user-editable metadata', () => {
    expect(isDemoAccount({ app_metadata: {}, user_metadata: { demo: true } })).toBe(false);
  });

  it('is false for ordinary or missing users', () => {
    expect(isDemoAccount({ app_metadata: { provider: 'email' } })).toBe(false);
    expect(isDemoAccount(null)).toBe(false);
    expect(isDemoAccount(undefined)).toBe(false);
  });
});
