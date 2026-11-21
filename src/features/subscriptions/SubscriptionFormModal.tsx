import { useState } from 'react';

import { CurrencyAmountField, type MoneyValue } from '@/features/fx/CurrencyAmountField';
import { DateField } from '@/shared/components/DateField';
import { Modal } from '@/shared/components/Modal';
import { Select } from '@/shared/components/Select';
import { BASE_CURRENCY } from '@/shared/lib/env';
import { todayISO } from '@/shared/lib/format';
import { toBaseAmount } from '@/shared/lib/money';
import type { BillingCycle, SubscriptionRow } from '@/shared/types/database';

import type { SubscriptionInput } from './api';

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export function SubscriptionFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: SubscriptionInput) => void;
  initial?: SubscriptionRow | null;
  saving?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit subscription' : 'Add subscription'}>
      <SubscriptionForm
        key={initial?.id ?? 'new'}
        initial={initial}
        onCancel={onClose}
        onSubmit={onSubmit}
        saving={saving}
      />
    </Modal>
  );
}

function SubscriptionForm({
  initial,
  onCancel,
  onSubmit,
  saving,
}: {
  initial?: SubscriptionRow | null;
  onCancel: () => void;
  onSubmit: (input: SubscriptionInput) => void;
  saving?: boolean;
}) {
  // FX is fetched as-of today for new subscriptions; editing seeds the stored
  // currency/rate so the frozen rate isn't refetched.
  const [date] = useState(() => todayISO());
  const [name, setName] = useState(() => initial?.name ?? '');
  const [cycle, setCycle] = useState<BillingCycle>(() => initial?.billing_cycle ?? 'monthly');
  const [nextDate, setNextDate] = useState(() => initial?.next_payment_date ?? '');
  const [active, setActive] = useState(() => initial?.is_active ?? true);
  const [money, setMoney] = useState<MoneyValue>(() =>
    initial
      ? {
          amountOriginal: initial.cost_original,
          currencyOriginal: initial.currency_original,
          exchangeRate: initial.exchange_rate,
        }
      : { amountOriginal: NaN, currencyOriginal: BASE_CURRENCY, exchangeRate: 1 },
  );

  const valid =
    name.trim().length > 0 &&
    money.amountOriginal > 0 &&
    !Number.isNaN(money.amountOriginal) &&
    money.exchangeRate > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      name: name.trim(),
      cost_original: money.amountOriginal,
      currency_original: money.currencyOriginal,
      exchange_rate: money.exchangeRate,
      cost_base: toBaseAmount(money.amountOriginal, money.exchangeRate),
      billing_cycle: cycle,
      next_payment_date: nextDate || null,
      is_active: active,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="sub-name">
          Name
        </label>
        <input
          id="sub-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Netflix"
          autoFocus
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Cost</label>
        <CurrencyAmountField value={money} date={date} onChange={setMoney} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="sub-cycle">
            Billing cycle
          </label>
          <Select id="sub-cycle" value={cycle} onChange={(v) => setCycle(v as BillingCycle)}>
            {CYCLES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="sub-next">
            Next payment <span className="text-content-muted">(optional)</span>
          </label>
          <DateField id="sub-next" value={nextDate} onChange={setNextDate} />
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Active — counts towards monthly totals
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving || !valid}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add subscription'}
        </button>
      </div>
    </form>
  );
}
