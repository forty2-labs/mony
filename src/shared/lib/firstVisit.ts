import { useEffect, useState } from 'react';

/**
 * Which views have already been shown in this session. Entrance animations
 * (staggered cards, charts drawing in) play only on a view's first visit, so
 * returning to a page whose data is cached shows it instantly instead of
 * looking like a reload. Reset when the signed-in user changes.
 */
const visited = new Set<string>();

export function hasVisited(key: string): boolean {
  return visited.has(key);
}

export function markVisited(key: string): void {
  visited.add(key);
}

export function resetVisits(): void {
  visited.clear();
}

/**
 * `true` on the first mount of `key` this session, `false` on every later one.
 * Reads during render but records after commit, so React's double rendering in
 * development can't flip the answer mid-mount.
 */
export function useFirstVisit(key: string): boolean {
  const [first] = useState(() => !hasVisited(key));
  useEffect(() => markVisited(key), [key]);
  return first;
}
