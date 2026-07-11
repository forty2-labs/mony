import { draftFromSigned, parseAmount } from './normalize';
import type { StatementParser } from './types';

/**
 * Wise (TransferWise) export. Signed `Amount` (negative = debit). Dates are
 * DD-MM-YYYY. Prefer the `Merchant` name for the description, falling back to
 * the verbose `Description`. Pending card transactions are flagged.
 */
export const wiseParser: StatementParser = {
  id: 'wise',
  label: 'Wise',
  description: 'Wise balance statement CSV',

  detect(keys) {
    let score = 0;
    if (keys.includes('transferwise id')) score += 0.5;
    if (keys.includes('payee account number')) score += 0.3;
    if (keys.includes('exchange rate')) score += 0.2;
    return Math.min(score, 1);
  },

  parse(rows) {
    return rows.map((r) => {
      const description = r['merchant'] || r['description'] || '';
      const draft = draftFromSigned({
        raw: r,
        signedAmount: parseAmount(r['amount']),
        currency: r['currency'],
        date: r['date'],
        description,
        // Wise names the other party in `Payee Name` (money out) or `Payer
        // Name` (money in) — used to catch transfers between your own accounts.
        counterparty: r['payee name'] || r['payer name'],
      });

      if (/pending/i.test(r['description'] || '')) draft.notes.push('Pending');
      return draft;
    });
  },
};
