import { draftFromSigned, parseAmount } from './normalize';
import type { StatementParser } from './types';

/**
 * Revolut export. The effective balance change is `Amount − Fee` (a fee-only
 * row like the premium plan charge has Amount 0 / Fee 7.99 → a 7.99 expense).
 * Non-COMPLETED rows (pending/reverted/declined) are parsed but left unselected
 * and flagged for the user to decide on.
 */
export const revolutParser: StatementParser = {
  id: 'revolut',
  label: 'Revolut',
  description: 'Revolut account CSV export',

  detect(keys) {
    let score = 0;
    if (keys.includes('started date')) score += 0.4;
    if (keys.includes('completed date')) score += 0.4;
    if (keys.includes('state')) score += 0.2;
    return Math.min(score, 1);
  },

  parse(rows) {
    return rows.map((r) => {
      const amount = parseAmount(r['amount']);
      const fee = parseAmount(r['fee']);
      const net = (Number.isFinite(amount) ? amount : 0) - (Number.isFinite(fee) ? fee : 0);

      // Revolut has no separate counterparty column — the other party is baked
      // into `Description` (e.g. "To Jane Doe", "Payment from …"), which the
      // internal-transfer check already scans, so there's nothing extra to pass.
      const draft = draftFromSigned({
        raw: r,
        signedAmount: net,
        currency: r['currency'],
        date: r['started date'] || r['completed date'],
        description: r['description'] || r['type'] || '',
      });

      const state = (r['state'] || '').toUpperCase();
      if (state && state !== 'COMPLETED') {
        draft.selected = false;
        draft.notes.push(`State: ${state}`);
      }
      return draft;
    });
  },
};
