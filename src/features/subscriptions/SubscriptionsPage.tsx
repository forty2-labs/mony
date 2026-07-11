import { useMemo, useState } from 'react';

import { EmptyState } from '@/shared/components/EmptyState';
import { Icon } from '@/shared/components/Icon';
import { PageHeader } from '@/shared/components/PageHeader';
import { Skeleton } from '@/shared/components/Skeleton';
import { StatCard } from '@/shared/components/StatCard';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/lib/cn';
import { currencySymbol } from '@/shared/lib/currencies';
import { BASE_CURRENCY } from '@/shared/lib/env';
import { formatDate, formatMoney } from '@/shared/lib/format';
import type { BillingCycle, SubscriptionRow } from '@/shared/types/database';

import type { SubscriptionInput } from './api';
import { monthlyEquivalent } from './api';
import { useSubscriptionMutations, useSubscriptions } from './hooks';
import { SubscriptionFormModal } from './SubscriptionFormModal';

const CYCLE_LABEL: Record<BillingCycle, string> = {
  weekly: 'wk',
  monthly: 'mo',
  quarterly: 'qtr',
  yearly: 'yr',
};

export function SubscriptionsPage() {
  const { data: subs, isLoading } = useSubscriptions();
  const { create, update, remove } = useSubscriptionMutations();
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionRow | null>(null);

  const totals = useMemo(() => {
    let monthly = 0;
    let active = 0;
    for (const s of subs ?? []) {
      if (!s.is_active) continue;
      active += 1;
      monthly += monthlyEquivalent(Number(s.cost_base), s.billing_cycle);
    }
    return { monthly, yearly: monthly * 12, active };
  }, [subs]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (s: SubscriptionRow) => {
    setEditing(s);
    setFormOpen(true);
  };

  const handleSubmit = (input: SubscriptionInput) => {
    const opts = {
      onSuccess: () => {
        toast.success(editing ? 'Subscription updated' : 'Subscription added');
        setFormOpen(false);
      },
      onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Save failed'),
    };
    if (editing) update.mutate({ id: editing.id, patch: input }, opts);
    else create.mutate(input, opts);
  };

  const toggleActive = (s: SubscriptionRow) => {
    update.mutate(
      { id: s.id, patch: { is_active: !s.is_active } },
      { onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed') },
    );
  };

  const handleDelete = (s: SubscriptionRow) => {
    if (!confirm(`Delete the subscription “${s.name}”? This cannot be undone.`)) return;
    remove.mutate(s.id, {
      onSuccess: () => toast.success('Subscription deleted'),
      onError: (e) => toast.error(e instanceof Error ? e.message : 'Delete failed'),
    });
  };

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        subtitle="Recurring payments, normalised to what they cost you each month."
        actions={
          <button className="btn-primary" onClick={openNew}>
            <Icon name="plus" size={16} />
            Add subscription
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Per month"
          value={formatMoney(totals.monthly)}
          hint="active subscriptions"
          icon="subscriptions"
          accent="brand"
        />
        <StatCard label="Per year" value={formatMoney(totals.yearly)} icon="calendar" />
        <StatCard
          label="Active"
          value={String(totals.active)}
          hint={totals.active === 1 ? 'subscription' : 'subscriptions'}
          icon="activity"
        />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : !subs || subs.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="subscriptions"
              title="No subscriptions yet"
              description="Add your recurring payments to see what they add up to each month."
              action={
                <button className="btn-primary" onClick={openNew}>
                  <Icon name="plus" size={16} />
                  Add subscription
                </button>
              }
            />
          </div>
        ) : (
          <div className="card divide-y divide-border overflow-hidden">
            {subs.map((s) => (
              <SubscriptionRowItem
                key={s.id}
                sub={s}
                onToggle={() => toggleActive(s)}
                onEdit={() => openEdit(s)}
                onDelete={() => handleDelete(s)}
              />
            ))}
          </div>
        )}
      </div>

      <SubscriptionFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        saving={create.isPending || update.isPending}
      />
    </div>
  );
}

function SubscriptionRowItem({
  sub,
  onToggle,
  onEdit,
  onDelete,
}: {
  sub: SubscriptionRow;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const monthly = monthlyEquivalent(Number(sub.cost_base), sub.billing_cycle);
  const foreign = sub.currency_original !== BASE_CURRENCY;

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2/50',
        !sub.is_active && 'opacity-55',
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon name="subscriptions" size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{sub.name}</p>
          {!sub.is_active && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-content-muted">
              Paused
            </span>
          )}
        </div>
        <p className="truncate text-xs text-content-muted">
          {formatMoney(Number(sub.cost_base))} / {CYCLE_LABEL[sub.billing_cycle]}
          {foreign && (
            <>
              {' · '}
              {currencySymbol(sub.currency_original)}
              {Number(sub.cost_original).toFixed(2)} {sub.currency_original}
            </>
          )}
          {sub.next_payment_date && <> · next {formatDate(sub.next_payment_date)}</>}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums">{formatMoney(monthly)}</p>
        <p className="text-xs text-content-muted">/mo</p>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
        <IconBtn
          name={sub.is_active ? 'moon' : 'sun'}
          title={sub.is_active ? 'Pause' : 'Resume'}
          onClick={onToggle}
        />
        <IconBtn name="edit" title="Edit" onClick={onEdit} />
        <IconBtn name="trash" title="Delete" danger onClick={onDelete} />
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
  name: 'edit' | 'trash' | 'moon' | 'sun';
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
