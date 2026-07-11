import type { StatementRow } from './csv';

export type TxnType = 'expense' | 'income';

/**
 * A single parsed statement line, normalised into the app's transaction shape
 * but still editable in the review modal. `amount_base` is derived (not stored)
 * so edits to amount/rate always recompute it — the frozen value is only fixed
 * at the moment of import.
 */
export interface DraftTransaction {
  rowId: string;
  selected: boolean;
  type: TxnType;
  occurredOn: string; // YYYY-MM-DD, '' when unparseable
  description: string;
  amountOriginal: number; // positive; NaN when unparseable
  currencyOriginal: string;
  exchangeRate: number; // original -> base
  categoryId: string | null;
  /** Raw category text from the statement, for later auto-mapping. */
  suggestedCategory: string | null;
  /** Parser diagnostics worth the user's attention (e.g. "Pending", "Reverted"). */
  notes: string[];
  /**
   * True when the row looks like a transfer between the user's own accounts
   * (counterparty matches a configured name). Pre-deselected in the review
   * modal because these net to zero across accounts.
   */
  internalTransfer: boolean;
  raw: StatementRow;
}

/** A pluggable statement format. Add a new bank by implementing this. */
export interface StatementParser {
  id: string;
  label: string;
  description: string;
  /** Confidence 0..1 that this parser matches the given (lower-cased) headers. */
  detect: (headerKeys: string[]) => number;
  parse: (rows: StatementRow[]) => DraftTransaction[];
}

export interface ParseOutcome {
  parserId: string;
  parserLabel: string;
  transactions: DraftTransaction[];
  skipped: number;
}
