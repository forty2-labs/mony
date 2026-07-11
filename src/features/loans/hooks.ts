import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createLoan,
  deleteLoan,
  listLoans,
  recordRepayment,
  updateLoan,
  type LoanInput,
  type LoanStatusFilter,
} from './api';

const KEY = ['loans'] as const;

export function useLoans(filter: LoanStatusFilter) {
  return useQuery({
    queryKey: [...KEY, filter],
    queryFn: () => listLoans(filter),
  });
}

export function useLoanMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const create = useMutation({ mutationFn: createLoan, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: (args: { id: string; patch: Partial<LoanInput> }) =>
      updateLoan(args.id, args.patch),
    onSuccess: invalidate,
  });
  const repay = useMutation({
    mutationFn: (args: { id: string; amountBase: number }) =>
      recordRepayment(args.id, args.amountBase),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteLoan, onSuccess: invalidate });

  return { create, update, repay, remove };
}
