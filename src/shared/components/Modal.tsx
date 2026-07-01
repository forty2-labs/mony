import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** Accessible-ish centered dialog with backdrop, Escape-to-close and scroll lock. */
export function Modal({
  open,
  onClose,
  title,
  children,
  widthClass = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  widthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`card relative z-10 w-full ${widthClass} my-8 p-6`}
          >
            <h2 className="mb-5 text-lg font-semibold tracking-tight">{title}</h2>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
