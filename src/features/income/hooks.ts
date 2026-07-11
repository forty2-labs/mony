import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createIncome,
  deleteIncome,
  type IncomeFilters,
  type IncomeInput,
  listIncome,
  updateIncome,
} from './api';

const KEY = ['income'] as const;

export function useIncome(filters: IncomeFilters) {
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => listIncome(filters),
  });
}

export function useIncomeMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const create = useMutation({ mutationFn: createIncome, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: (args: { id: string; patch: Partial<IncomeInput> }) =>
      updateIncome(args.id, args.patch),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteIncome, onSuccess: invalidate });

  return { create, update, remove };
}
