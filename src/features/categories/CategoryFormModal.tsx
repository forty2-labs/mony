import { useEffect, useState } from 'react';
import { Modal } from '@/shared/components/Modal';
import { Icon, CATEGORY_ICONS, type IconName } from '@/shared/components/Icon';
import { cn } from '@/shared/lib/cn';
import type { CategoryRow } from '@/shared/types/database';
import type { CategoryInput, CategoryKind } from './api';

const PALETTE = [
  '#34A368', '#0A84FF', '#5E5CE6', '#FF375F', '#FF9F0A',
  '#30D158', '#64D2FF', '#E8A23A', '#8E8E93', '#98989D',
];

const DEFAULT_ICON: IconName = 'tag';

export function CategoryFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  defaultKind,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CategoryInput) => void;
  initial?: CategoryRow | null;
  defaultKind: CategoryKind;
  saving?: boolean;
}) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<CategoryKind>(defaultKind);
  const [color, setColor] = useState<string>(PALETTE[0]);
  const [icon, setIcon] = useState<IconName>(DEFAULT_ICON);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setKind((initial?.kind as CategoryKind) ?? defaultKind);
    setColor(initial?.color ?? PALETTE[0]);
    setIcon((initial?.icon as IconName) ?? DEFAULT_ICON);
  }, [open, initial, defaultKind]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), kind, color, icon });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit category' : 'New category'}>
      <form onSubmit={submit} className="space-y-4">
        {/* Live preview */}
        <div className="flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3">
          <span
            className="grid h-10 w-10 place-items-center rounded-xl"
            style={{ backgroundColor: color + '22', color }}
          >
            <Icon name={icon} size={20} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name || 'Category name'}</p>
            <p className="text-xs capitalize text-content-muted">{kind}</p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="cat-name">
            Name
          </label>
          <input
            id="cat-name"
            className="input"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Groceries"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Type</span>
          <div className="inline-flex rounded-xl border border-border bg-surface-2 p-1">
            {(['expense', 'income'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-sm capitalize transition',
                  kind === k ? 'bg-surface text-content shadow-soft' : 'text-content-muted',
                )}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Color</span>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                className={cn(
                  'h-7 w-7 rounded-full ring-offset-2 ring-offset-surface transition',
                  color === c && 'ring-2 ring-content',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Icon</span>
          <div className="grid grid-cols-10 gap-1.5">
            {CATEGORY_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                aria-label={ic}
                className={cn(
                  'grid aspect-square place-items-center rounded-lg border transition',
                  icon === ic
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border text-content-muted hover:bg-surface-2 hover:text-content',
                )}
              >
                <Icon name={ic} size={17} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
