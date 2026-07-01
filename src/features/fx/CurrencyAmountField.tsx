import { useEffect, useRef, useState } from 'react';
import { BASE_CURRENCY } from '@/shared/lib/env';
import { CURRENCIES, currencySymbol } from '@/shared/lib/currencies';
import { toBaseAmount } from '@/shared/lib/money';
import { formatMoney } from '@/shared/lib/format';
import { fetchRateToBase } from './fxService';
import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/lib/cn';

export interface MoneyValue {
  amountOriginal: number;
  currencyOriginal: string;
  exchangeRate: number;
}

/**
 * Composite control for entering a monetary amount in any currency. When the
 * currency isn't the base, it auto-fetches the rate as-of `date` and shows the
 * converted base amount — but the rate stays editable (manual override).
 */
export function CurrencyAmountField({
  value,
  date,
  onChange,
  autoFocus,
}: {
  value: MoneyValue;
  date: string;
  onChange: (next: MoneyValue) => void;
  autoFocus?: boolean;
}) {
  const { amountOriginal, currencyOriginal, exchangeRate } = value;
  const isForeign = currencyOriginal !== BASE_CURRENCY;
  const [rateStatus, setRateStatus] = useState<'idle' | 'loading' | 'manual' | 'live'>(
    isForeign ? 'manual' : 'idle',
  );

  // Always merge async results onto the *latest* value, never the one captured
  // when the fetch started — otherwise an amount typed mid-fetch gets wiped.
  const valueRef = useRef(value);
  valueRef.current = value;

  // Seed with the initial currency:date so editing an existing foreign
  // transaction does NOT refetch and overwrite its frozen historical rate.
  // New entries start in the base currency, so they still fetch on switch.
  const fetchedKey = useRef<string>(`${value.currencyOriginal}:${date}`);

  useEffect(() => {
    if (!isForeign) {
      if (exchangeRate !== 1) onChange({ ...valueRef.current, exchangeRate: 1 });
      setRateStatus('idle');
      fetchedKey.current = `${BASE_CURRENCY}:${date}`;
      return;
    }
    const key = `${currencyOriginal}:${date}`;
    if (fetchedKey.current === key) return;
    fetchedKey.current = key;

    let active = true;
    setRateStatus('loading');
    fetchRateToBase(currencyOriginal, date).then((result) => {
      if (!active) return;
      if (result) {
        setRateStatus('live');
        onChange({ ...valueRef.current, currencyOriginal, exchangeRate: result.rate });
      } else {
        setRateStatus('manual');
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyOriginal, date, isForeign]);

  const rate = Number.isNaN(exchangeRate) ? 0 : exchangeRate;
  const baseAmount = toBaseAmount(amountOriginal || 0, rate || 0);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-content-muted">
            {currencySymbol(currencyOriginal)}
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            autoFocus={autoFocus}
            className="input pl-8"
            placeholder="0.00"
            value={Number.isNaN(amountOriginal) ? '' : amountOriginal}
            onChange={(e) =>
              onChange({ ...value, amountOriginal: parseFloat(e.target.value) })
            }
          />
        </div>
        <select
          className="input w-28"
          value={currencyOriginal}
          onChange={(e) => onChange({ ...value, currencyOriginal: e.target.value })}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </select>
      </div>

      {isForeign && (
        <div className="rounded-xl border border-border bg-surface-2 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2 text-content-muted" htmlFor="fx-rate">
              <span>Rate → {BASE_CURRENCY}</span>
              <button
                type="button"
                onClick={refresh}
                title="Fetch the latest rate"
                className="rounded-md p-1 text-content-muted transition hover:bg-surface hover:text-content"
              >
                <Icon name="subscriptions" size={13} />
              </button>
            </label>
            <input
              id="fx-rate"
              type="number"
              step="0.00000001"
              min="0"
              className="input h-8 w-32 py-1 text-right"
              value={Number.isNaN(exchangeRate) ? '' : exchangeRate}
              onChange={(e) => {
                setRateStatus('manual');
                onChange({ ...valueRef.current, exchangeRate: parseFloat(e.target.value) });
              }}
            />
          </div>
          <div className="mt-2 flex items-end justify-between gap-3 border-t border-border pt-2">
            <span
              className={cn(
                'text-xs',
                rateStatus === 'manual' ? 'text-warning' : 'text-content-muted',
              )}
            >
              {rateStatus === 'loading' && 'Fetching live rate…'}
              {rateStatus === 'live' && `Live · 1 ${currencyOriginal} ≈ ${rate.toFixed(4)} ${BASE_CURRENCY}`}
              {rateStatus === 'manual' && `Manual · 1 ${currencyOriginal} = ${(rate || 0).toFixed(4)} ${BASE_CURRENCY}`}
              {rateStatus === 'idle' && `1 ${currencyOriginal} = ${(rate || 0).toFixed(4)} ${BASE_CURRENCY}`}
            </span>
            <span className="text-base font-semibold tabular-nums text-content">
              {formatMoney(baseAmount)}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  function refresh() {
    if (!isForeign) return;
    fetchedKey.current = '';
    setRateStatus('loading');
    fetchRateToBase(currencyOriginal, date).then((result) => {
      fetchedKey.current = `${currencyOriginal}:${date}`;
      if (result) {
        setRateStatus('live');
        onChange({ ...valueRef.current, exchangeRate: result.rate });
      } else {
        setRateStatus('manual');
      }
    });
  }
}
