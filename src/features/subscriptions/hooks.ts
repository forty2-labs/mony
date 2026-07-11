import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createSubscription,
  deleteSubscription,
  listSubscriptions,
  type SubscriptionInput,
  updateSubscription,
} from './api';

const KEY = ['subscriptions'] as const;

export function useSubscriptions() {
  return useQuery({ queryKey: KEY, queryFn: listSubscriptions });
}

export function useSubscriptionMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({ mutationFn: createSubscription, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: (args: { id: string; patch: Partial<SubscriptionInput> }) =>
      updateSubscription(args.id, args.patch),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteSubscription, onSuccess: invalidate });

  return { create, update, remove };
}
