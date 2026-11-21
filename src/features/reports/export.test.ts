import { describe, expect, it } from 'vitest';

import { csvCell } from './export';

describe('csvCell', () => {
  it('leaves plain values alone', () => {
    expect(csvCell('Tesco')).toBe('Tesco');
    expect(csvCell(12.5)).toBe('12.5');
    expect(csvCell(null)).toBe('');
  });

  it('keeps negative numbers numeric', () => {
    expect(csvCell(-42)).toBe('-42');
  });

  it.each(['=HYPERLINK("http://x")', '+1+1', '-2+3', '@SUM(A1)', '\tcmd', '\rcmd'])(
    'neutralises formula trigger %j',
    (input) => {
      const out = csvCell(input);
      expect(out.replace(/^"/, '').startsWith("'")).toBe(true);
    },
  );

  it('quotes and escapes embedded quotes, commas and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
  });
});
