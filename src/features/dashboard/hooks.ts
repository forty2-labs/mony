import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from './api';

export function useDashboard(month: string) {
  return useQuery({
    queryKey: ['dashboard', month],
    queryFn: () => fetchDashboard(month),
  });
}
