import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client. Defaults lean toward a local-first feel: data is
 * considered fresh for a minute and we don't refetch aggressively on focus.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
