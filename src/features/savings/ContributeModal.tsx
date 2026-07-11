import { useState } from 'react';

import { Modal } from '@/shared/components/Modal';
import { cn } from '@/shared/lib/cn';
import { currencySymbol } from '@/shared/lib/currencies';
import { BASE_CURRENCY } from '@/shared/lib/env';
import { formatMoney } from '@/shared/lib/format';
import type { SavingsGoalRow } from '@/shared/types/database';

/** Add to or withdraw from a goal's saved balance. */
export function ContributeModal({
  goal,
  onClose,
  onSubmit,
  saving,
}: {
  goal: SavingsGoalRow | null;
  onClose: () => void;
  onSubmit: (delta: number) => void;
  saving?: boolean;
}) {
  return (
    <Modal
      open={!!goal}
      onClose={onClose}
      title={goal ? `Update “${goal.name}”` : ''}
      widthClass="max-w-sm"
    >
      {goal && (
        <ContributeForm
          key={goal.id}
          goal={goal}
          onCancel={onClose}
          onSubmit={onSubmit}
          saving={saving}
        />
      )}
    </Modal>
  );
}

function ContributeForm({
  goal,
  onCancel,
  onSubmit,
  saving,
}: {
  goal: SavingsGoalRow;
  onCancel: () => void;
  onSubmit: (delta: number) => void;
  saving?: boolean;
}) {
  const [mode, setMode] = useState<'add' | 'withdraw'>('add');
  const [amount, setAmount] = useState('');

  const num = parseFloat(amount);
  const valid = num > 0 && !Number.isNaN(num);
  const current = Number(goal.current_amount_base);
  const delta = mode === 'add' ? num : -num;
  const projected = Math.max(0, current + (valid ? delta : 0));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit(delta);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="inline-flex rounded-xl border border-border p-1">
        {(['add', 'withdraw'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition',
              mode === m ? 'bg-brand text-brand-fg' : 'text-content-muted hover:text-content',
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="contrib-amount">
          Amount
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-content-muted">
            {currencySymbol(BASE_CURRENCY)}
          </span>
          <input
            id="contrib-amount"
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
        <span className="text-content-muted">New balance</span>
        <span className="font-semibold tabular-nums">{formatMoney(projected)}</span>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving || !valid}>
          {saving ? 'Saving…' : mode === 'add' ? 'Add funds' : 'Withdraw'}
        </button>
      </div>
    </form>
  );
}
