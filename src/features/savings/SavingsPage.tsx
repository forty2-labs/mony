import { useMemo, useState } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { EmptyState } from '@/shared/components/EmptyState';
import { Icon } from '@/shared/components/Icon';
import { PageHeader } from '@/shared/components/PageHeader';
import { Skeleton } from '@/shared/components/Skeleton';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/lib/cn';
import { formatDate, formatMoney } from '@/shared/lib/format';
import type { SavingsGoalRow } from '@/shared/types/database';

import type { SavingsGoalInput } from './api';
import { ContributeModal } from './ContributeModal';
import { useGoalMutations, useGoals } from './hooks';
import { SavingsGoalFormModal } from './SavingsGoalFormModal';

export function SavingsPage() {
  const { data: goals, isLoading } = useGoals();
  const { create, update, adjust, remove } = useGoalMutations();
  const toast = useToast();
  const confirm = useConfirm();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoalRow | null>(null);
  const [contributing, setContributing] = useState<SavingsGoalRow | null>(null);

  const totals = useMemo(() => {
    let saved = 0;
    let target = 0;
    for (const g of goals ?? []) {
      saved += Number(g.current_amount_base);
      target += Number(g.target_amount_base);
    }
    return { saved, target };
  }, [goals]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (g: SavingsGoalRow) => {
    setEditing(g);
    setFormOpen(true);
  };

  const handleSubmit = (input: SavingsGoalInput) => {
    const opts = {
      onSuccess: () => {
        toast.success(editing ? 'Goal updated' : 'Goal created');
        setFormOpen(false);
      },
      onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Save failed'),
    };
    if (editing) update.mutate({ id: editing.id, patch: input }, opts);
    else create.mutate(input, opts);
  };

  const handleContribute = (delta: number) => {
    if (!contributing) return;
    adjust.mutate(
      { id: contributing.id, delta },
      {
        onSuccess: () => {
          toast.success(delta >= 0 ? 'Funds added' : 'Funds withdrawn');
          setContributing(null);
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
      },
    );
  };

  const handleDelete = async (g: SavingsGoalRow) => {
    const ok = await confirm({
      title: `Delete “${g.name}”?`,
      message: 'The goal and the progress saved towards it will be removed. This can’t be undone.',
    });
    if (!ok) return;
    remove.mutate(g.id, {
      onSuccess: () => toast.success('Goal deleted'),
      onError: (e) => toast.error(e instanceof Error ? e.message : 'Delete failed'),
    });
  };

  return (
    <div>
      <PageHeader
        title="Savings goals"
        subtitle={
          goals && goals.length > 0
            ? `${formatMoney(totals.saved)} saved of ${formatMoney(totals.target)} target`
            : 'Track progress towards the things you’re saving for.'
        }
        actions={
          <button className="btn-primary" onClick={openNew}>
            <Icon name="plus" size={16} />
            New goal
          </button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : !goals || goals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="savings"
            title="No savings goals yet"
            description="Create a goal to start tracking how close you are to your target."
            action={
              <button className="btn-primary" onClick={openNew}>
                <Icon name="plus" size={16} />
                New goal
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onContribute={() => setContributing(g)}
              onEdit={() => openEdit(g)}
              onDelete={() => handleDelete(g)}
            />
          ))}
        </div>
      )}

      <SavingsGoalFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        saving={create.isPending || update.isPending}
      />
      <ContributeModal
        goal={contributing}
        onClose={() => setContributing(null)}
        onSubmit={handleContribute}
        saving={adjust.isPending}
      />
    </div>
  );
}

function GoalCard({
  goal,
  onContribute,
  onEdit,
  onDelete,
}: {
  goal: SavingsGoalRow;
  onContribute: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const current = Number(goal.current_amount_base);
  const target = Number(goal.target_amount_base);
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const complete = current >= target;
  const remaining = Math.max(0, target - current);

  return (
    <div className="card group flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{goal.name}</h3>
          {goal.deadline && (
            <p className="mt-0.5 text-xs text-content-muted">
              <Icon name="calendar" size={12} className="mr-1 inline align-[-1px]" />
              by {formatDate(goal.deadline)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          <IconBtn name="edit" title="Edit" onClick={onEdit} />
          <IconBtn name="trash" title="Delete" danger onClick={onDelete} />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xl font-semibold tabular-nums">{formatMoney(current)}</span>
          <span className="text-sm text-content-muted tabular-nums">of {formatMoney(target)}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              complete ? 'bg-success' : 'bg-brand',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className={cn('mt-1.5 text-xs', complete ? 'text-success' : 'text-content-muted')}>
          {complete ? '🎉 Goal reached!' : `${formatMoney(remaining)} to go · ${Math.round(pct)}%`}
        </p>
      </div>

      <button className="btn-ghost mt-4 w-full justify-center" onClick={onContribute}>
        <Icon name="plus" size={15} />
        Add funds
      </button>
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
