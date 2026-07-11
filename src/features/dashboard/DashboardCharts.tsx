import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { EmptyState } from '@/shared/components/EmptyState';
import { formatMoney } from '@/shared/lib/format';

import type { TrendPoint } from './api';

const INCOME_COLOR = '#31c07f';
const EXPENSE_COLOR = '#f16d6d';

function TooltipBox({ rows }: { rows: { label: string; value: number; color: string }[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-soft-lg">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
          <span className="text-content-muted">{r.label}</span>
          <span className="ml-auto font-medium tabular-nums text-content">
            {formatMoney(r.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** 6-month grouped income vs expenses bars. */
export function TrendChart({ data }: { data: TrendPoint[] }) {
  const hasData = data.some((d) => d.income > 0 || d.expenses > 0);
  if (!hasData) return <EmptyState icon="reports" title="No activity in this range yet" />;

  return (
    <div className="h-64 w-full text-content-muted">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'currentColor', fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: 'currentColor', fontSize: 11 }}
            tickFormatter={(v) => formatMoney(Number(v)).replace(/\.00$/, '')}
          />
          <Tooltip
            cursor={{ fill: 'rgb(128 128 128 / 0.08)' }}
            content={({ active, payload, label }) =>
              active && payload && payload.length ? (
                <div>
                  <p className="mb-1 px-1 text-xs font-medium text-content">{label}</p>
                  <TooltipBox
                    rows={[
                      {
                        label: 'Income',
                        value: Number(payload[0]?.value ?? 0),
                        color: INCOME_COLOR,
                      },
                      {
                        label: 'Expenses',
                        value: Number(payload[1]?.value ?? 0),
                        color: EXPENSE_COLOR,
                      },
                    ]}
                  />
                </div>
              ) : null
            }
          />
          <Bar dataKey="income" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={26} />
          <Bar dataKey="expenses" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
