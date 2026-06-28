import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { Icon } from '@/shared/components/Icon';
import { formatMoney } from '@/shared/lib/format';
import { useAuth } from '@/features/auth/AuthProvider';

/**
 * Phase 1 dashboard. The layout, design language and empty states are final;
 * live figures are wired to real queries in Phase 2 once the expenses and income
 * modules exist. Zeros below are placeholders, not computed values.
 */
export function DashboardPage() {
  const { user } = useAuth();
  const name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'there';

  return (
    <div>
      <PageHeader
        title={`Good to see you, ${name}`}
        subtitle="Here's your financial overview. Live data arrives in Phase 2."
        actions={
          <button className="btn-primary" disabled title="Available in Phase 2">
            <Icon name="plus" size={16} />
            Quick add
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Current balance" value={formatMoney(0)} hint="Across all accounts" />
        <StatCard
          label="Income this month"
          value={formatMoney(0)}
          accent="success"
          hint="June 2026"
        />
        <StatCard
          label="Expenses this month"
          value={formatMoney(0)}
          accent="danger"
          hint="June 2026"
        />
        <StatCard label="Net savings" value={formatMoney(0)} accent="brand" hint="Income − expenses" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Income vs expenses</h2>
          <div className="mt-4 grid h-48 place-items-center rounded-xl border border-dashed border-border text-sm text-content-muted">
            Charts arrive with the Reports module (Phase 4)
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold">Recent transactions</h2>
          <div className="mt-4 grid h-48 place-items-center rounded-xl border border-dashed border-border px-4 text-center text-sm text-content-muted">
            No transactions yet. Add your first expense in Phase 2.
          </div>
        </div>
      </div>
    </div>
  );
}
