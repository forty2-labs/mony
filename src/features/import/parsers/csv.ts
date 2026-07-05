/**
 * Minimal, dependency-free delimited-text parser.
 *
 * Bank "CSV" exports are inconsistent: Monzo/Revolut/Wise samples are actually
 * tab-separated despite the .csv extension, and real comma exports quote fields
 * that contain commas or newlines. So we sniff the delimiter from the header row
 * and parse with a small state machine that understands RFC-4180 style quoting
 * ("" escapes a quote inside a quoted field).
 */

export type StatementRow = Record<string, string>;

export interface ParsedTable {
  headers: string[];
  /** Data rows keyed by lower-cased header name (values trimmed). */
  rows: StatementRow[];
  /** Rows dropped because they were entirely empty. */
  skipped: number;
}

const DELIMITERS = ['\t', ',', ';', '|'] as const;

/** Pick the delimiter that appears most often in the first (header) line. */
export function sniffDelimiter(sample: string): string {
  const firstLine = sample.split(/\r?\n/, 1)[0] ?? '';
  let best = ',';
  let bestCount = -1;
  for (const d of DELIMITERS) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

/** Tokenise the whole document into a grid of raw string cells. */
function toGrid(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++; // skip the escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      pushField();
    } else if (ch === '\n') {
      pushRow();
    } else if (ch === '\r') {
      // swallow; the \n (if any) will end the row
    } else {
      field += ch;
    }
  }

  // Flush trailing field/row if the file doesn't end with a newline.
  if (field !== '' || row.length > 0) pushRow();

  return rows;
}

export function parseDelimited(text: string, delimiter?: string): ParsedTable {
  const clean = text.replace(/^\uFEFF/, ''); // strip UTF-8 BOM
  const delim = delimiter ?? sniffDelimiter(clean);
  const grid = toGrid(clean, delim);

  const headerCells = grid.shift() ?? [];
  const headers = headerCells.map((h) => h.trim());
  const keys = headers.map((h) => h.toLowerCase());

  let skipped = 0;
  const rows: StatementRow[] = [];
  for (const cells of grid) {
    if (!cells.some((c) => c.trim() !== '')) {
      skipped++;
      continue;
    }
    const obj: StatementRow = {};
    keys.forEach((key, idx) => {
      obj[key] = (cells[idx] ?? '').trim();
    });
    rows.push(obj);
  }

  return { headers, rows, skipped };
}
