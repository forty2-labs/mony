import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  contribute,
  createGoal,
  deleteGoal,
  listGoals,
  type SavingsGoalInput,
  updateGoal,
} from './api';

const KEY = ['savings'] as const;

export function useGoals() {
  return useQuery({ queryKey: KEY, queryFn: listGoals });
}

export function useGoalMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({ mutationFn: createGoal, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: (args: { id: string; patch: Partial<SavingsGoalInput> }) =>
      updateGoal(args.id, args.patch),
    onSuccess: invalidate,
  });
  const adjust = useMutation({
    mutationFn: (args: { id: string; delta: number }) => contribute(args.id, args.delta),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteGoal, onSuccess: invalidate });

  return { create, update, adjust, remove };
}
