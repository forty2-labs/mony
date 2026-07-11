import { draftFromSigned, parseAmount } from './normalize';
import type { StatementParser } from './types';

/**
 * Monzo personal export. Signed `Amount` column (negative = money out), with
 * `Money Out`/`Money In` as a fallback. Dates are DD/MM/YYYY. The statement's
 * own `Category` is kept as a suggestion for auto-mapping.
 */
export const monzoParser: StatementParser = {
  id: 'monzo',
  label: 'Monzo',
  description: 'Monzo personal account CSV export',

  detect(keys) {
    let score = 0;
    if (keys.includes('transaction id')) score += 0.4;
    if (keys.includes('money in') && keys.includes('money out')) score += 0.4;
    if (keys.includes('emoji')) score += 0.2;
    return Math.min(score, 1);
  },

  parse(rows) {
    return rows.map((r) => {
      let signed = parseAmount(r['amount']);
      if (!Number.isFinite(signed)) {
        const moneyIn = parseAmount(r['money in']);
        const moneyOut = parseAmount(r['money out']);
        signed = Number.isFinite(moneyIn) ? moneyIn : -Math.abs(moneyOut);
      }
      const description = r['description'] || r['name'] || r['notes and #tags'] || r['type'] || '';

      return draftFromSigned({
        raw: r,
        signedAmount: signed,
        currency: r['currency'],
        date: r['date'],
        description,
        // Monzo's `Name` is the counterparty (pot name, payee, own-account
        // transfer target) — used to detect transfers between your accounts.
        counterparty: r['name'],
        suggestedCategory: r['category'],
      });
    });
  },
};
