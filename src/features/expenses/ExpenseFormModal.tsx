import { Modal } from '@/shared/components/Modal';

import type { ExpenseInput, ExpenseWithCategory } from './api';
import { ExpenseForm } from './ExpenseForm';

/**
 * Modal wrapper around {@link ExpenseForm}, used for editing an existing
 * expense (and as a quick-add path on narrow screens). Inline adding on the
 * expenses page renders `ExpenseForm` directly in a sidebar card.
 *
 * The inner form is keyed and mounted only while open, so it initialises its
 * state synchronously from `initial` — see ExpenseForm for why this matters to FX.
 */
export function ExpenseFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ExpenseInput) => void;
  initial?: ExpenseWithCategory | null;
  saving?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit expense' : 'Add expense'}>
      <ExpenseForm
        key={initial?.id ?? 'new'}
        initial={initial}
        onCancel={onClose}
        onSubmit={onSubmit}
        saving={saving}
      />
    </Modal>
  );
}
