import { describe, expect, it } from 'vitest';

import { FAQ, FEATURES, PRICING, PRIVACY, STEPS } from './content';

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
