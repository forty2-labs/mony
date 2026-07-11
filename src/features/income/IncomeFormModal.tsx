import { useState } from 'react';
import { Modal } from '@/shared/components/Modal';
import { DateField } from '@/shared/components/DateField';
import { BASE_CURRENCY } from '@/shared/lib/env';
import { todayISO } from '@/shared/lib/format';
import { toBaseAmount } from '@/shared/lib/money';
import { CurrencyAmountField, type MoneyValue } from '@/features/fx/CurrencyAmountField';
import { type IncomeInput, type IncomeWithCategory } from './api';
import { useCategories } from '../categories/hooks';

export function IncomeFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: IncomeInput) => void;
  initial?: IncomeWithCategory | null;
  saving?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit income' : 'Add income'}>
      <IncomeForm
        key={initial?.id ?? 'new'}
        initial={initial}
        onCancel={onClose}
        onSubmit={onSubmit}
        saving={saving}
      />
    </Modal>
  );
}

function IncomeForm({
  initial,
  onCancel,
  onSubmit,
  saving,
}: {
  initial?: IncomeWithCategory | null;
  onCancel: () => void;
  onSubmit: (input: IncomeInput) => void;
  saving?: boolean;
}) {
  const { data: categories } = useCategories();
  const incomeCats = (categories ?? []).filter((c) => c.kind === 'income');
  
  const [date, setDate] = useState(() => initial?.occurred_on ?? todayISO());
  const [categoryId, setCategoryId] = useState(() => initial?.category_id ?? '');
  const [notes, setNotes] = useState(() => initial?.notes ?? '');
  const [money, setMoney] = useState<MoneyValue>(() =>
    initial
      ? {
          amountOriginal: initial.amount_original,
          currencyOriginal: initial.currency_original,
          exchangeRate: initial.exchange_rate,
        }
      : { amountOriginal: NaN, currencyOriginal: BASE_CURRENCY, exchangeRate: 1 },
  );

  const valid =
    money.amountOriginal > 0 &&
    !Number.isNaN(money.amountOriginal) &&
    money.exchangeRate > 0 &&
    !!date;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      category_id: categoryId || null,
      amount_original: money.amountOriginal,
      currency_original: money.currencyOriginal,
      exchange_rate: money.exchangeRate,
      amount_base: toBaseAmount(money.amountOriginal, money.exchangeRate),
      occurred_on: date,
      notes: notes.trim() || null,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Amount</label>
        <CurrencyAmountField value={money} date={date} onChange={setMoney} autoFocus />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="inc-date">
            Date
          </label>
          <DateField id="inc-date" value={date} max={todayISO()} onChange={setDate} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="inc-source">
            Category
          </label>
          <select
            id="inc-source"
            className="input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Uncategorised</option>
            {incomeCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="inc-notes">
          Notes <span className="text-content-muted">(optional)</span>
        </label>
        <input
          id="inc-notes"
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. June payslip"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving || !valid}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add income'}
        </button>
      </div>
    </form>
  );
}
