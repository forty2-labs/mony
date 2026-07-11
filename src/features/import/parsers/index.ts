import { parseDelimited } from './csv';
import { monzoParser } from './monzo';
import { revolutParser } from './revolut';
import type { ParseOutcome, StatementParser } from './types';
import { wiseParser } from './wise';

export { draftBaseAmount, validateDraft } from './normalize';
export type { DraftTransaction, ParseOutcome, StatementParser, TxnType } from './types';

/** Registry — add a new bank here and it appears everywhere automatically. */
export const PARSERS: StatementParser[] = [monzoParser, revolutParser, wiseParser];

const MIN_CONFIDENCE = 0.5;

export function getParser(id: string): StatementParser | undefined {
  return PARSERS.find((p) => p.id === id);
}

/** Best-matching parser for a header row, or null if nothing is confident. */
export function detectParser(headerKeys: string[]): StatementParser | null {
  let best: StatementParser | null = null;
  let bestScore = 0;
  for (const parser of PARSERS) {
    const score = parser.detect(headerKeys);
    if (score > bestScore) {
      bestScore = score;
      best = parser;
    }
  }
  return bestScore >= MIN_CONFIDENCE ? best : null;
}

/**
 * Parse raw statement text end to end. When `parserId` is omitted the format is
 * auto-detected from the header row. Throws with a friendly message when the
 * format can't be recognised.
 */
export function parseStatement(text: string, parserId?: string): ParseOutcome {
  const table = parseDelimited(text);
  const keys = table.headers.map((h) => h.toLowerCase());

  const parser = parserId ? getParser(parserId) : detectParser(keys);
  if (!parser) {
    throw new Error(
      "Couldn't recognise this statement format. Pick the bank manually from the list.",
    );
  }

  return {
    parserId: parser.id,
    parserLabel: parser.label,
    transactions: parser.parse(table.rows),
    skipped: table.skipped,
  };
}
