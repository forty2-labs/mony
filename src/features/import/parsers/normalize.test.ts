import { describe, expect, it } from 'vitest';

import { draftFromSigned, flagInternalTransfers, isInternalTransfer } from './normalize';

const draft = (description: string, counterparty = '') =>
  draftFromSigned({
    raw: {},
    signedAmount: -10,
    currency: 'GBP',
    date: '2026-01-02',
    description,
    counterparty,
  });

describe('own-account transfer detection', () => {
  it('never matches when the user has configured no names', () => {
    expect(isInternalTransfer('Transfer to Jane Doe', [])).toBe(false);
  });

  it('matches case-insensitively on a substring', () => {
    expect(isInternalTransfer('To JANE DOE savings', ['jane doe'])).toBe(true);
    expect(isInternalTransfer('Tesco Stores', ['jane doe'])).toBe(false);
  });

  it('deselects matching rows and leaves the rest untouched', () => {
    const rows = [draft('Tesco'), draft('Payment', 'Jane Doe')];
    const out = flagInternalTransfers(rows, ['jane doe']);
    expect(out[0]).toMatchObject({ internalTransfer: false, selected: true });
    expect(out[1]).toMatchObject({ internalTransfer: true, selected: false });
  });
});

describe('draftFromSigned', () => {
  it('treats negative amounts as expenses and positive as income', () => {
    expect(draft('x').type).toBe('expense');
    expect(
      draftFromSigned({
        raw: {},
        signedAmount: 5,
        currency: 'gbp',
        date: '02/01/2026',
        description: 'x',
      }),
    ).toMatchObject({
      type: 'income',
      amountOriginal: 5,
      currencyOriginal: 'GBP',
      occurredOn: '2026-01-02',
    });
  });
});
