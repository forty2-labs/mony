import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createExpense,
  deleteExpense,
  type ExpenseFilters,
  type ExpenseInput,
  listExpenses,
  updateExpense,
} from './api';

const KEY = ['expenses'] as const;

export function useExpenses(filters: ExpenseFilters) {
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => listExpenses(filters),
  });
}

export function useExpenseMutations() {
  const qc = useQueryClient();
  // Expenses feed the dashboard too, so invalidate both.
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const create = useMutation({ mutationFn: createExpense, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: (args: { id: string; patch: Partial<ExpenseInput> }) =>
      updateExpense(args.id, args.patch),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteExpense, onSuccess: invalidate });

  return { create, update, remove };
}
