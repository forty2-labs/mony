import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Must not exceed the API's `max_rows` (supabase/config.toml, and the hosted
 * project's API settings). A page shorter than this is treated as the last one.
 */
export const PAGE_SIZE = 1000;

type PageResult<T> = PromiseLike<{ data: T[] | null; error: PostgrestError | null }>;

/**
 * Read every row of a query by walking it in `PAGE_SIZE` pages.
 *
 * PostgREST silently caps each response at `max_rows`, so a plain `await query`
 * returns at most 1,000 rows and any totals summed from it are wrong for larger
 * accounts. `page` must build a fresh query each call and apply `.range(from, to)`,
 * and the query needs a deterministic order (end with a unique column such as `id`)
 * so pages neither overlap nor skip rows.
 */
export async function fetchAll<T>(page: (from: number, to: number) => PageResult<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const chunk = data ?? [];
    rows.push(...chunk);
    if (chunk.length < PAGE_SIZE) return rows;
  }
}
