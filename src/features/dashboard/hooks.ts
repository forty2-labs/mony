import { useQuery } from '@tanstack/react-query';

import { fetchExpenseHeatmap, fetchOverview } from './api';

/**
 * All-time balance + recent activity. Keyed under the `['dashboard']` prefix so
 * expense/income mutations invalidate it.
 */
export function useOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: fetchOverview,
  });
}

/**
 * Rolling ~1-year expense contribution heatmap. Keyed independently so the
 * report range doesn't refetch it, but still under the `['dashboard']` prefix
 * so expense mutations invalidate it.
 */
export function useExpenseHeatmap() {
  return useQuery({
    queryKey: ['dashboard', 'heatmap'],
    queryFn: fetchExpenseHeatmap,
  });
}
