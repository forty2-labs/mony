import { describe, expect, it } from 'vitest';

import { passwordProblem } from './password';

describe('passwordProblem (mirror of the server policy)', () => {
  it('accepts a password meeting every rule', () => {
    expect(passwordProblem('Sufficient1x')).toBe(true);
  });

  it.each([
    ['Short1a', /at least 10/i],
    ['ALLUPPERCASE1', /lower-case/i],
    ['alllowercase1', /upper-case/i],
    ['NoDigitsHereAtAll', /number/i],
  ])('rejects %j', (pw, message) => {
    expect(passwordProblem(pw)).toMatch(message);
  });
});
