import { useQuery } from '@tanstack/react-query';

import { fetchReport, type RangeKey } from './api';

/**
 * Report aggregates for a preset range. Keyed under the `['dashboard']` prefix
 * so expense/income mutations (which invalidate `['dashboard']`) also refresh
 * an open report.
 */
export function useReport(range: RangeKey) {
  return useQuery({
    queryKey: ['dashboard', 'report', range],
    queryFn: () => fetchReport(range),
  });
}
