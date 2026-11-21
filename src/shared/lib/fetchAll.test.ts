import { describe, expect, it } from 'vitest';

import { fetchAll, PAGE_SIZE } from './fetchAll';

/** A fake paged source that serves `total` rows, like PostgREST with max_rows. */
function source(total: number) {
  const calls: [number, number][] = [];
  const page = async (from: number, to: number) => {
    calls.push([from, to]);
    const end = Math.min(to + 1, total, from + PAGE_SIZE);
    const data = Array.from({ length: Math.max(0, end - from) }, (_, i) => from + i);
    return { data, error: null };
  };
  return { page, calls };
}

describe('fetchAll', () => {
  it('returns every row across pages (beyond the 1,000-row API cap)', async () => {
    const { page, calls } = source(2_345);
    const rows = await fetchAll(page);
    expect(rows).toHaveLength(2_345);
    expect(rows[0]).toBe(0);
    expect(rows.at(-1)).toBe(2_344);
    expect(calls).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it('makes one extra request when the total is an exact multiple of the page size', async () => {
    const { page, calls } = source(2_000);
    expect(await fetchAll(page)).toHaveLength(2_000);
    expect(calls).toHaveLength(3);
  });

  it('handles empty results', async () => {
    const { page } = source(0);
    expect(await fetchAll(page)).toEqual([]);
  });

  it('throws the first error', async () => {
    const err = { message: 'boom', details: '', hint: '', code: 'XX000', name: 'PostgrestError' };
    await expect(fetchAll(async () => ({ data: null, error: err as never }))).rejects.toMatchObject(
      { message: 'boom' },
    );
  });
});
