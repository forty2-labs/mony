import { useState } from 'react';
import { Modal } from '@/shared/components/Modal';
import { DateField } from '@/shared/components/DateField';
import { currencySymbol } from '@/shared/lib/currencies';
import { BASE_CURRENCY } from '@/shared/lib/env';
import type { SavingsGoalInput } from './api';
import type { SavingsGoalRow } from '@/shared/types/database';

export function SavingsGoalFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: SavingsGoalInput) => void;
  initial?: SavingsGoalRow | null;
  saving?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit goal' : 'New savings goal'}>
      <GoalForm
        key={initial?.id ?? 'new'}
        initial={initial}
        onCancel={onClose}
        onSubmit={onSubmit}
        saving={saving}
      />
    </Modal>
  );
}

function GoalForm({
  initial,
  onCancel,
  onSubmit,
  saving,
}: {
  initial?: SavingsGoalRow | null;
  onCancel: () => void;
  onSubmit: (input: SavingsGoalInput) => void;
  saving?: boolean;
}) {
  const [name, setName] = useState(() => initial?.name ?? '');
  const [target, setTarget] = useState(() =>
    initial ? String(initial.target_amount_base) : '',
  );
  const [current, setCurrent] = useState(() =>
    initial ? String(initial.current_amount_base) : '',
  );
  const [deadline, setDeadline] = useState(() => initial?.deadline ?? '');

  const targetNum = parseFloat(target);
  const currentNum = current ? parseFloat(current) : 0;
  const valid = name.trim().length > 0 && targetNum > 0 && !Number.isNaN(targetNum);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      name: name.trim(),
      target_amount_base: targetNum,
      current_amount_base: Number.isNaN(currentNum) ? 0 : Math.max(0, currentNum),
      deadline: deadline || null,
    });
  };

  const sym = currencySymbol(BASE_CURRENCY);

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="goal-name">
          Goal name
        </label>
        <input
          id="goal-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Emergency fund"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="goal-target">
            Target amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-content-muted">
              {sym}
            </span>
            <input
              id="goal-target"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className="input pl-7"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="goal-current">
            Saved so far
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-content-muted">
              {sym}
            </span>
            <input
              id="goal-current"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className="input pl-7"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="goal-deadline">
          Target date <span className="text-content-muted">(optional)</span>
        </label>
        <DateField id="goal-deadline" value={deadline} onChange={setDeadline} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving || !valid}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create goal'}
        </button>
      </div>
    </form>
  );
}
