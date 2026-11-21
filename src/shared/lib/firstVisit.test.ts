import { beforeEach, describe, expect, it } from 'vitest';

import { hasVisited, markVisited, resetVisits } from './firstVisit';

describe('first-visit registry', () => {
  beforeEach(() => resetVisits());

  it('reports a key as unvisited until it is marked', () => {
    expect(hasVisited('dashboard')).toBe(false);
    markVisited('dashboard');
    expect(hasVisited('dashboard')).toBe(true);
  });

  it('tracks keys independently', () => {
    markVisited('dashboard');
    expect(hasVisited('expenses')).toBe(false);
  });

  it('forgets everything on reset, e.g. when the signed-in user changes', () => {
    markVisited('dashboard');
    resetVisits();
    expect(hasVisited('dashboard')).toBe(false);
  });
});
