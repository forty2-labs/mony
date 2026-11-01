import { useEffect, useState } from 'react';

import { RANGE_OPTIONS, type RangeKey, type RangeSelection } from '@/features/reports/api';

const STORAGE_KEY = 'vault:dashboard-range';
const DEFAULT_RANGE: RangeSelection = { key: 'last_12_months' };
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Last range picked on the dashboard, falling back to the default when
 *  storage is unavailable or holds something unrecognised. */
function loadRange(): RangeSelection {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RANGE;
    const v = JSON.parse(raw) as Partial<{ key: string; from: string; to: string }>;
    if (v.key === 'custom') {
      if (v.from && v.to && ISO_DATE.test(v.from) && ISO_DATE.test(v.to) && v.from <= v.to) {
        return { key: 'custom', from: v.from, to: v.to };
      }
    } else if (RANGE_OPTIONS.some((o) => o.key === v.key)) {
      return { key: v.key as RangeKey };
    }
  } catch {
    // Blocked or corrupt storage — use the default.
  }
  return DEFAULT_RANGE;
}

/** Dashboard range state, persisted to localStorage so it survives reloads. */
export function usePersistedRange() {
  const [range, setRange] = useState<RangeSelection>(loadRange);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(range));
    } catch {
      // Non-essential; the range just won't be remembered.
    }
  }, [range]);
  return [range, setRange] as const;
}
