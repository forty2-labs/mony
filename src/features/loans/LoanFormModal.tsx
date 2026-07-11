import { useState } from 'react';

import { CurrencyAmountField, type MoneyValue } from '@/features/fx/CurrencyAmountField';
import { DateField } from '@/shared/components/DateField';
import { Modal } from '@/shared/components/Modal';
import { BASE_CURRENCY } from '@/shared/lib/env';
import { todayISO } from '@/shared/lib/format';
import { toBaseAmount } from '@/shared/lib/money';
import type { LoanRow, LoanStatus } from '@/shared/types/database';

import type { LoanInput } from './api';

const STATUS_OPTIONS: { value: LoanStatus; label: string }[] = [
  { value: 'outstanding', label: 'Outstanding' },
  { value: 'partially_repaid', label: 'Partially repaid' },
  { value: 'repaid', label: 'Repaid' },
  { value: 'written_off', label: 'Written off' },
];

export function LoanFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: LoanInput) => void;
  initial?: LoanRow | null;
  saving?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit loan' : 'Record a loan'}>
      <LoanForm
        key={initial?.id ?? 'new'}
        initial={initial}
        onCancel={onClose}
        onSubmit={onSubmit}
        saving={saving}
      />
    </Modal>
  );
}

function LoanForm({
  initial,
  onCancel,
  onSubmit,
  saving,
}: {
  initial?: LoanRow | null;
  onCancel: () => void;
  onSubmit: (input: LoanInput) => void;
  saving?: boolean;
}) {
  // No dedicated "lent on" column, so FX is fetched as-of today for new loans.
  // Editing seeds the stored currency/rate so the frozen rate is preserved.
  const [date] = useState(() => todayISO());
  const [person, setPerson] = useState(() => initial?.person_name ?? '');
  const [returnDate, setReturnDate] = useState(() => initial?.expected_return_date ?? '');
  const [status, setStatus] = useState<LoanStatus>(() => initial?.status ?? 'outstanding');
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
    person.trim().length > 0 &&
    money.amountOriginal > 0 &&
    !Number.isNaN(money.amountOriginal) &&
    money.exchangeRate > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      person_name: person.trim(),
      amount_original: money.amountOriginal,
      currency_original: money.currencyOriginal,
      exchange_rate: money.exchangeRate,
      amount_base: toBaseAmount(money.amountOriginal, money.exchangeRate),
      expected_return_date: returnDate || null,
      status,
      notes: notes.trim() || null,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="loan-person">
          Person
        </label>
        <input
          id="loan-person"
          className="input"
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          placeholder="Who did you lend to?"
          autoFocus
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Amount lent</label>
        <CurrencyAmountField value={money} date={date} onChange={setMoney} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="loan-return">
            Expected return <span className="text-content-muted">(optional)</span>
          </label>
          <DateField id="loan-return" value={returnDate} onChange={setReturnDate} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="loan-status">
            Status
          </label>
          <select
            id="loan-status"
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as LoanStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="loan-notes">
          Notes <span className="text-content-muted">(optional)</span>
        </label>
        <input
          id="loan-notes"
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What was it for?"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving || !valid}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Record loan'}
        </button>
      </div>
    </form>
  );
}
