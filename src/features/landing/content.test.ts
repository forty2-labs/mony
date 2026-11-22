import { describe, expect, it } from 'vitest';

import { CONTACT_URL, FAQ, FEATURES, PRICING, PRIVACY, STEPS } from './content';

/** Phrases for things mony doesn't do (yet). Landing copy must never promise them. */
const UNBACKED = [
  /duplicate/i, // duplicate detection is a later phase
  /every change/i, // no CI runs the tests automatically yet
  /keep using it/i, // what happens after testing hasn't been decided
  /connects? to your bank|open banking/i,
];

const allCopy = [
  ...STEPS.flatMap((s) => [s.title, s.body]),
  ...FEATURES.flatMap((f) => [f.title, f.body]),
  ...PRIVACY,
  ...PRICING.flatMap((p) => [p.note, ...p.points]),
  ...FAQ.flatMap((f) => [f.q, f.a]),
];

describe('landing copy', () => {
  it('makes no claims the product cannot back', () => {
    const offending = allCopy.filter((text) => UNBACKED.some((re) => re.test(text)));
    expect(offending).toEqual([]);
  });
});

describe('contact', () => {
  it('points to the Upwork profile', () => {
    expect(CONTACT_URL).toBe('https://www.upwork.com/freelancers/~0123dda34004da49e6');
  });

  it('routes the paid and custom plans to it, and nothing to email', () => {
    const byName = Object.fromEntries(PRICING.map((p) => [p.name, p.href]));
    expect(byName.Lifetime).toBe(CONTACT_URL);
    expect(byName.Custom).toBe(CONTACT_URL);
    expect(PRICING.some((p) => p.href.startsWith('mailto:'))).toBe(false);
    expect(allCopy.some((text) => /\bemail\b/i.test(text))).toBe(false);
  });
});
