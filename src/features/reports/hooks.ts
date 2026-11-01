import { useQuery } from '@tanstack/react-query';

import { fetchReport, type RangeSelection } from './api';

/**
 * Report aggregates for a preset or custom range. Keyed under the `['dashboard']` prefix
 * so expense/income mutations (which invalidate `['dashboard']`) also refresh
 * an open report.
 */
export function useReport(range: RangeSelection) {
  return useQuery({
    queryKey: ['dashboard', 'report', range],
    queryFn: () => fetchReport(range),
  });
}
