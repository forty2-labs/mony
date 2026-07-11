import { useMutation, useQueryClient } from '@tanstack/react-query';

import { bulkImport } from './api';

/**
 * Bulk import mutation. Touches both transaction tables and the dashboard
 * totals, so it invalidates all three query keys on success.
 */
export function useBulkImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkImport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['income'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
