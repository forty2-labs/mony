import { useState } from 'react';

import { useCategories } from '@/features/categories/hooks';
import { CurrencyAmountField, type MoneyValue } from '@/features/fx/CurrencyAmountField';
import { DateField } from '@/shared/components/DateField';
import { Select } from '@/shared/components/Select';
import { BASE_CURRENCY } from '@/shared/lib/env';
import { todayISO } from '@/shared/lib/format';
import { toBaseAmount } from '@/shared/lib/money';

import type { ExpenseInput, ExpenseWithCategory } from './api';

/**
 * Create/edit form for an expense. Uses local state rather than React Hook Form
 * because the currency/FX sub-field is an async, self-managing controlled widget.
 *
 * Mount this keyed so it initialises its state synchronously from `initial`
 * (lazy useState). This matters for FX: it lets the currency field start at the
 * stored currency/rate and therefore NOT refetch — preserving the frozen
 * historical rate when editing.
 *
 * When `onCancel` is omitted (inline add card) the form renders a single
 * full-width submit button instead of the Cancel / Save button row.
 */
export function ExpenseForm({
  initial,
  onCancel,
  onSubmit,
  saving,
}: {
  initial?: ExpenseWithCategory | null;
  onCancel?: () => void;
  onSubmit: (input: ExpenseInput) => void;
  saving?: boolean;
}) {
  const { data: categories } = useCategories();
  const expenseCats = (categories ?? []).filter((c) => c.kind === 'expense');

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
        <CurrencyAmountField value={money} date={date} onChange={setMoney} autoFocus={!!onCancel} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="exp-date">
            Date
          </label>
          <DateField id="exp-date" value={date} max={todayISO()} onChange={setDate} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="exp-cat">
            Category
          </label>
          <Select
            id="exp-cat"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Uncategorised</option>
            {expenseCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="exp-notes">
          Notes <span className="text-content-muted">(optional)</span>
        </label>
        <input
          id="exp-notes"
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What was this for?"
        />
      </div>

      {onCancel ? (
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving || !valid}>
            {saving ? 'Saving…' : initial ? 'Save changes' : 'Add expense'}
          </button>
        </div>
      ) : (
        <button type="submit" className="btn-primary w-full" disabled={saving || !valid}>
          {saving ? 'Saving…' : 'Add expense'}
        </button>
      )}
    </form>
  );
}
