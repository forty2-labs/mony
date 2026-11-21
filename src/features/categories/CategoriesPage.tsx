import { useState } from 'react';

import { CategoryBadge } from '@/shared/components/CategoryBadge';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { EmptyState } from '@/shared/components/EmptyState';
import { Icon } from '@/shared/components/Icon';
import { PageHeader } from '@/shared/components/PageHeader';
import { Skeleton } from '@/shared/components/Skeleton';
import { useToast } from '@/shared/components/Toast';
import type { CategoryRow } from '@/shared/types/database';

import type { CategoryInput, CategoryKind } from './api';
import { CategoryFormModal } from './CategoryFormModal';
import { useCategories, useCategoryMutations } from './hooks';

export function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const { create, update, remove } = useCategoryMutations();
  const toast = useToast();
  const confirm = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [formKind, setFormKind] = useState<CategoryKind>('expense');

  const expense = (categories ?? []).filter((c) => c.kind === 'expense');
  const income = (categories ?? []).filter((c) => c.kind === 'income');

  const openNew = (kind: CategoryKind) => {
    setEditing(null);
    setFormKind(kind);
    setModalOpen(true);
  };
  const openEdit = (cat: CategoryRow) => {
    setEditing(cat);
    setFormKind(cat.kind as CategoryKind);
    setModalOpen(true);
  };

  const handleSubmit = (input: CategoryInput) => {
    if (editing) {
      update.mutate(
        { id: editing.id, patch: input },
        {
          onSuccess: () => {
            toast.success('Category updated');
            setModalOpen(false);
          },
          onError: (e) => toast.error(e instanceof Error ? e.message : 'Update failed'),
        },
      );
    } else {
      create.mutate(input, {
        onSuccess: () => {
          toast.success('Category created');
          setModalOpen(false);
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Create failed'),
      });
    }
  };

  const handleDelete = async (cat: CategoryRow) => {
    const ok = await confirm({
      title: `Delete “${cat.name}”?`,
      message: 'Transactions keep their record but lose this label.',
    });
    if (!ok) return;
    remove.mutate(cat.id, {
      onSuccess: () => toast.success('Category deleted'),
      onError: (e) => toast.error(e instanceof Error ? e.message : 'Delete failed'),
    });
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organise expenses and income. Used across the whole app."
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <CategoryColumn
            title="Expense categories"
            items={expense}
            onAdd={() => openNew('expense')}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
          <CategoryColumn
            title="Income categories"
            items={income}
            onAdd={() => openNew('income')}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </div>
      )}

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        defaultKind={formKind}
        saving={create.isPending || update.isPending}
      />
    </div>
  );
}

function CategoryColumn({
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string;
  items: CategoryRow[];
  onAdd: () => void;
  onEdit: (c: CategoryRow) => void;
  onDelete: (c: CategoryRow) => void;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button onClick={onAdd} className="btn-ghost h-8 px-2.5 text-sm">
          <Icon name="plus" size={16} />
          Add
        </button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon="categories" title="No categories yet" />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((c) => (
            <li key={c.id} className="group flex items-center gap-3 px-5 py-3">
              <CategoryBadge color={c.color} icon={c.icon} size={32} />
              <span className="flex-1 text-sm">{c.name}</span>
              <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => onEdit(c)}
                  className="rounded-lg p-1.5 text-content-muted hover:bg-surface-2 hover:text-content"
                  title="Edit"
                >
                  <Icon name="edit" size={16} />
                </button>
                <button
                  onClick={() => onDelete(c)}
                  className="rounded-lg p-1.5 text-content-muted hover:bg-surface-2 hover:text-danger"
                  title="Delete"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
