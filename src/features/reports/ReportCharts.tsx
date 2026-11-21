import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { EmptyState } from '@/shared/components/EmptyState';
import { formatMoney } from '@/shared/lib/format';

import type { ReportCategory, ReportTrendPoint } from './api';

const INCOME_COLOR = 'rgb(var(--success))';
const EXPENSE_COLOR = 'rgb(var(--danger))';
const NET_COLOR = 'rgb(var(--brand))';

/** A tiny colour swatch + label, used for the chart legend. */
function LegendChip({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-content-muted">
      {dashed ? (
        <span className="h-0 w-3.5 border-t-2 border-dashed" style={{ borderColor: color }} />
      ) : (
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      {label}
    </span>
  );
}

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

interface PlottedPoint extends ReportTrendPoint {
  incomeLine: number;
  expensesLine: number;
  netLine: number;
}

/**
 * Hold each series at its last recorded level through months with no entries,
 * rather than letting the line dive to 0 (e.g. the current, not-yet-logged
 * month). Months before a series' first entry stay at 0. The real monthly
 * figures are kept alongside for the tooltip.
 */
function carryForward(data: ReportTrendPoint[]): PlottedPoint[] {
  let income = 0;
  let expenses = 0;
  return data.map((d) => {
    if (d.income > 0) income = d.income;
    if (d.expenses > 0) expenses = d.expenses;
    return { ...d, incomeLine: income, expensesLine: expenses, netLine: income - expenses };
  });
}

/**
 * Monthly cash-flow: income and expenses as filled areas, with the resulting
 * net savings drawn as a line on the same axis so you can read the gap and the
 * savings trajectory at once.
 */
export function TrendAreaChart({ data }: { data: ReportTrendPoint[] }) {
  const hasData = data.some((d) => d.income > 0 || d.expenses > 0);
  if (!hasData) return <EmptyState icon="reports" title="No activity in this range yet" />;

  const plotted = carryForward(data);
  const hasNegativeNet = plotted.some((d) => d.netLine < 0);

  return (
    <div className="flex w-full flex-col text-content-muted">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <LegendChip color={INCOME_COLOR} label="Income" />
        <LegendChip color={EXPENSE_COLOR} label="Expenses" />
        <LegendChip color={NET_COLOR} label="Net saved" dashed />
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={plotted} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="rpt-income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={INCOME_COLOR} stopOpacity={0.32} />
                <stop offset="100%" stopColor={INCOME_COLOR} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="rpt-expense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={EXPENSE_COLOR} stopOpacity={0.32} />
                <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgb(128 128 128 / 0.12)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'currentColor', fontSize: 12 }}
              minTickGap={16}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fill: 'currentColor', fontSize: 11 }}
              tickFormatter={(v) => formatMoney(Number(v)).replace(/\.00$/, '')}
            />
            {hasNegativeNet ? (
              <ReferenceLine y={0} stroke="rgb(128 128 128 / 0.35)" strokeWidth={1} />
            ) : null}
            <Tooltip
              cursor={{ stroke: 'rgb(128 128 128 / 0.3)' }}
              content={({ active, payload, label }) => {
                const point = payload?.[0]?.payload as PlottedPoint | undefined;
                if (!active || !point) return null;
                const empty = point.income === 0 && point.expenses === 0;
                return (
                  <div>
                    <p className="mb-1 px-1 text-xs font-medium text-content">{label}</p>
                    <TooltipBox
                      rows={[
                        { label: 'Income', value: point.income, color: INCOME_COLOR },
                        { label: 'Expenses', value: point.expenses, color: EXPENSE_COLOR },
                        { label: 'Net saved', value: point.net, color: NET_COLOR },
                      ]}
                    />
                    {empty ? (
                      <p className="mt-1 px-1 text-[11px] text-content-muted">
                        No entries — line held at last level
                      </p>
                    ) : null}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="incomeLine"
              stroke={INCOME_COLOR}
              strokeWidth={2}
              fill="url(#rpt-income)"
            />
            <Area
              type="monotone"
              dataKey="expensesLine"
              stroke={EXPENSE_COLOR}
              strokeWidth={2}
              fill="url(#rpt-expense)"
            />
            <Line
              type="monotone"
              dataKey="netLine"
              stroke={NET_COLOR}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Donut of category shares. Renders the top slices; a caller-supplied list is
 *  assumed to already be sorted by total descending. */
export function CategoryDonut({ data }: { data: ReportCategory[] }) {
  if (data.length === 0) return <EmptyState icon="budgets" title="Nothing to break down yet" />;

  const total = data.reduce((a, c) => a + c.total, 0);

  return (
    <div className="relative h-56 w-full text-content-muted">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            innerRadius="62%"
            outerRadius="100%"
            paddingAngle={1.5}
            stroke="none"
          >
            {data.map((c) => (
              <Cell key={c.name} fill={c.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) =>
              active && payload && payload.length ? (
                <TooltipBox
                  rows={[
                    {
                      label: String(payload[0]?.name ?? ''),
                      value: Number(payload[0]?.value ?? 0),
                      color: (payload[0]?.payload as ReportCategory)?.color ?? '#888',
                    },
                  ]}
                />
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-content-muted">Total</span>
        <span className="text-lg font-semibold tabular-nums text-content">
          {formatMoney(total)}
        </span>
      </div>
    </div>
  );
}
