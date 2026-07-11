import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type BudgetInput,
  copyBudgets,
  deleteBudget,
  listBudgets,
  spendByCategory,
  upsertBudget,
} from './api';

const KEY = ['budgets'] as const;

export function useBudgets(month: string) {
  return useQuery({
    queryKey: [...KEY, month],
    queryFn: () => listBudgets(month),
  });
}

export function useSpendByCategory(month: string) {
  return useQuery({
    queryKey: [...KEY, 'spend', month],
    queryFn: () => spendByCategory(month),
  });
}

export function useBudgetMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const upsert = useMutation({
    mutationFn: (args: { month: string; input: BudgetInput }) =>
      upsertBudget(args.month, args.input),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteBudget, onSuccess: invalidate });
  const copy = useMutation({
    mutationFn: (args: { from: string; to: string }) => copyBudgets(args.from, args.to),
    onSuccess: invalidate,
  });

  return { upsert, remove, copy };
}
