import { useQuery } from '@tanstack/react-query';

import { fetchDashboard, fetchExpenseHeatmap } from './api';

export function useDashboard(month: string) {
  return useQuery({
    queryKey: ['dashboard', month],
    queryFn: () => fetchDashboard(month),
  });
}

/**
 * Rolling ~1-year expense contribution heatmap. Keyed independently of the
 * dashboard month so switching months doesn't refetch it, but still under the
 * `['dashboard']` prefix so expense mutations invalidate it.
 */
export function useExpenseHeatmap() {
  return useQuery({
    queryKey: ['dashboard', 'heatmap'],
    queryFn: fetchExpenseHeatmap,
  });
}
