import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';

import { Icon } from './Icon';
import { Modal } from './Modal';

export interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  /** Label for the confirming button. Defaults to "Delete". */
  confirmLabel?: string;
  /** `danger` (the default) styles the confirm button for destructive actions. */
  tone?: 'danger' | 'default';
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/**
 * App-wide confirmation dialog, replacing the browser's `confirm()`. Render
 * once inside the app; call `useConfirm()` anywhere below it:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: 'Delete this expense?' }))) return;
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback<Confirm>((next) => {
    // A second request while one is open cancels the first.
    resolver.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  }, []);

  const cancel = useCallback(() => settle(false), [settle]);

  // Keep showing the last request while the dialog animates out.
  const last = useRef<ConfirmOptions | null>(null);
  if (options) last.current = options;
  const view = options ?? last.current;
  const danger = (view?.tone ?? 'danger') === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={options !== null}
        onClose={cancel}
        title={view?.title ?? ''}
        widthClass="max-w-sm"
      >
        <div className="-mt-2 flex gap-4">
          {danger ? (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
              <Icon name="trash" size={18} />
            </span>
          ) : null}
          {view?.message ? (
            <div className="pt-1 text-sm text-content-muted">{view.message}</div>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          {/* Cancel takes focus, so Enter never confirms a destructive action by accident. */}
          <button type="button" className="btn-ghost" onClick={cancel} autoFocus>
            Cancel
          </button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={() => settle(true)}
          >
            {view?.confirmLabel ?? 'Delete'}
          </button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm(): Confirm {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}
