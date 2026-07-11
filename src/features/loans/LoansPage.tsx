import { useMemo, useState } from 'react';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { Icon } from '@/shared/components/Icon';
import { Skeleton } from '@/shared/components/Skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/lib/cn';
import { formatMoney, formatDate, todayISO } from '@/shared/lib/format';
import { currencySymbol } from '@/shared/lib/currencies';
import { BASE_CURRENCY } from '@/shared/lib/env';
import { useLoans, useLoanMutations } from './hooks';
import { LoanFormModal } from './LoanFormModal';
import { RepaymentModal } from './RepaymentModal';
import type { LoanInput, LoanStatusFilter } from './api';
import type { LoanRow, LoanStatus } from '@/shared/types/database';

const STATUS_META: Record<LoanStatus, { label: string; className: string }> = {
  outstanding: { label: 'Outstanding', className: 'bg-warning/10 text-warning' },
  partially_repaid: { label: 'Partially repaid', className: 'bg-brand/10 text-brand' },
  repaid: { label: 'Repaid', className: 'bg-success/10 text-success' },
  written_off: { label: 'Written off', className: 'bg-surface-2 text-content-muted' },
};

const FILTERS: { value: LoanStatusFilter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'all', label: 'All' },
  { value: 'repaid', label: 'Repaid' },
  { value: 'written_off', label: 'Written off' },
];

export function LoansPage() {
  const [filter, setFilter] = useState<LoanStatusFilter>('open');
  const { data: loans, isLoading } = useLoans(filter);
  const { create, update, repay, remove } = useLoanMutations();
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LoanRow | null>(null);
  const [repaying, setRepaying] = useState<LoanRow | null>(null);

  // Summary is always over *open* loans regardless of the current view filter.
  const { data: openLoans } = useLoans('open');
  const totals = useMemo(() => {
    let outstanding = 0;
    for (const l of openLoans ?? []) {
      outstanding += Math.max(0, Number(l.amount_base) - Number(l.amount_repaid_base));
    }
    return { outstanding, count: openLoans?.length ?? 0 };
  }, [openLoans]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (l: LoanRow) => {
    setEditing(l);
    setFormOpen(true);
  };

  const handleSubmit = (input: LoanInput) => {
    const opts = {
      onSuccess: () => {
        toast.success(editing ? 'Loan updated' : 'Loan recorded');
        setFormOpen(false);
      },
      onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Save failed'),
    };
    if (editing) update.mutate({ id: editing.id, patch: input }, opts);
    else create.mutate(input, opts);
  };

  const handleRepay = (amountBase: number) => {
    if (!repaying) return;
    repay.mutate(
      { id: repaying.id, amountBase },
      {
        onSuccess: () => {
          toast.success('Repayment recorded');
          setRepaying(null);
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
      },
    );
  };

  const handleDelete = (l: LoanRow) => {
    if (!confirm(`Delete the loan to ${l.person_name}? This cannot be undone.`)) return;
    remove.mutate(l.id, {
      onSuccess: () => toast.success('Loan deleted'),
      onError: (e) => toast.error(e instanceof Error ? e.message : 'Delete failed'),
    });
  };

  return (
    <div>
      <PageHeader
        title="Loans"
        subtitle="Money you’ve lent out and what’s still owed to you."
        actions={
          <button className="btn-primary" onClick={openNew}>
            <Icon name="plus" size={16} />
            Record loan
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Outstanding"
          value={formatMoney(totals.outstanding)}
          hint="still owed to you"
          icon="loans"
          accent={totals.outstanding > 0 ? 'warning' : 'success'}
        />
        <StatCard
          label="Open loans"
          value={String(totals.count)}
          hint={totals.count === 1 ? 'active loan' : 'active loans'}
          icon="hand-heart"
        />
      </div>

      <div className="mt-6 mb-4 inline-flex rounded-xl border border-border p-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition',
              filter === f.value ? 'bg-brand text-brand-fg' : 'text-content-muted hover:text-content',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !loans || loans.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="loans"
            title="No loans here"
            description="Record money you lend to friends or family to keep track of repayments."
            action={
              <button className="btn-primary" onClick={openNew}>
                <Icon name="plus" size={16} />
                Record loan
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map((l) => (
            <LoanCard
              key={l.id}
              loan={l}
              onRepay={() => setRepaying(l)}
              onEdit={() => openEdit(l)}
              onDelete={() => handleDelete(l)}
            />
          ))}
        </div>
      )}

      <LoanFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        saving={create.isPending || update.isPending}
      />
      <RepaymentModal
        loan={repaying}
        onClose={() => setRepaying(null)}
        onSubmit={handleRepay}
        saving={repay.isPending}
      />
    </div>
  );
}

function LoanCard({
  loan,
  onRepay,
  onEdit,
  onDelete,
}: {
  loan: LoanRow;
  onRepay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const total = Number(loan.amount_base);
  const repaid = Number(loan.amount_repaid_base);
  const outstanding = Math.max(0, total - repaid);
  const pct = total > 0 ? Math.min(100, (repaid / total) * 100) : 0;
  const meta = STATUS_META[loan.status];
  const isOpen = loan.status === 'outstanding' || loan.status === 'partially_repaid';
  const overdue =
    isOpen && loan.expected_return_date != null && loan.expected_return_date < todayISO();

  return (
    <div className="card group p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{loan.person_name}</h3>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', meta.className)}>
              {meta.label}
            </span>
            {overdue && (
              <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                Overdue
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-content-muted">
            {loan.currency_original !== BASE_CURRENCY && (
              <>
                {currencySymbol(loan.currency_original)}
                {Number(loan.amount_original).toFixed(2)} {loan.currency_original} ·{' '}
              </>
            )}
            Lent {formatMoney(total)}
            {loan.expected_return_date && <> · due {formatDate(loan.expected_return_date)}</>}
            {loan.notes && <> · {loan.notes}</>}
          </p>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          <IconBtn name="edit" title="Edit" onClick={onEdit} />
          <IconBtn name="trash" title="Delete" danger onClick={onDelete} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-success transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-content-muted tabular-nums">
          {formatMoney(repaid)} repaid
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <span className="text-lg font-semibold tabular-nums">{formatMoney(outstanding)}</span>
          <span className="ml-1 text-xs text-content-muted">outstanding</span>
        </div>
        {isOpen && (
          <button className="btn-ghost" onClick={onRepay}>
            <Icon name="send" size={15} />
            Record repayment
          </button>
        )}
      </div>
    </div>
  );
}

function IconBtn({
  name,
  title,
  onClick,
  danger,
}: {
  name: 'edit' | 'trash';
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'rounded-lg p-1.5 text-content-muted hover:bg-surface-2',
        danger ? 'hover:text-danger' : 'hover:text-content',
      )}
    >
      <Icon name={name} size={16} />
    </button>
  );
}
