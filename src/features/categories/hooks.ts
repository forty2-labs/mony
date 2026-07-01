import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from './api';

const KEY = ['categories'] as const;

export function useCategories(includeArchived = false) {
  return useQuery({
    queryKey: [...KEY, { includeArchived }],
    queryFn: () => listCategories(includeArchived),
  });
}

export function useCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({ mutationFn: createCategory, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: (args: { id: string; patch: Parameters<typeof updateCategory>[1] }) =>
      updateCategory(args.id, args.patch),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteCategory, onSuccess: invalidate });

  return { create, update, remove };
}
