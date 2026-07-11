import { useState } from 'react';
import { Modal } from '@/shared/components/Modal';
import { formatMoney } from '@/shared/lib/format';
import { currencySymbol } from '@/shared/lib/currencies';
import { BASE_CURRENCY } from '@/shared/lib/env';
import type { LoanRow } from '@/shared/types/database';

/** Record a repayment (in base currency) against a loan's outstanding balance. */
export function RepaymentModal({
  loan,
  onClose,
  onSubmit,
  saving,
}: {
  loan: LoanRow | null;
  onClose: () => void;
  onSubmit: (amountBase: number) => void;
  saving?: boolean;
}) {
  return (
    <Modal
      open={!!loan}
      onClose={onClose}
      title={loan ? `Repayment from ${loan.person_name}` : ''}
      widthClass="max-w-sm"
    >
      {loan && <RepaymentForm key={loan.id} loan={loan} onCancel={onClose} onSubmit={onSubmit} saving={saving} />}
    </Modal>
  );
}

function RepaymentForm({
  loan,
  onCancel,
  onSubmit,
  saving,
}: {
  loan: LoanRow;
  onCancel: () => void;
  onSubmit: (amountBase: number) => void;
  saving?: boolean;
}) {
  const outstanding = Math.max(0, Number(loan.amount_base) - Number(loan.amount_repaid_base));
  const [amount, setAmount] = useState('');

  const num = parseFloat(amount);
  const valid = num > 0 && !Number.isNaN(num);
  const remainingAfter = Math.max(0, outstanding - (valid ? num : 0));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit(num);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5 text-sm">
        <span className="text-content-muted">Outstanding</span>
        <span className="font-semibold tabular-nums">{formatMoney(outstanding)}</span>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium" htmlFor="repay-amount">
            Amount repaid
          </label>
          <button
            type="button"
            className="text-xs text-brand hover:underline"
            onClick={() => setAmount(String(outstanding))}
          >
            Full amount
          </button>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-content-muted">
            {currencySymbol(BASE_CURRENCY)}
          </span>
          <input
            id="repay-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            className="input pl-7"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            autoFocus
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5 text-sm">
        <span className="text-content-muted">Remaining after</span>
        <span className="font-semibold tabular-nums">{formatMoney(remainingAfter)}</span>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving || !valid}>
          {saving ? 'Saving…' : 'Record repayment'}
        </button>
      </div>
    </form>
  );
}
