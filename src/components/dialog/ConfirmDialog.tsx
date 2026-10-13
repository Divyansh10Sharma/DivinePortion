import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useUiLock } from '../../lib/uiLocks';

/** Small centred confirm dialog (PLAN-9 prompt). Holds a UI lock while open (IOS-6 / IOS-11). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useUiLock(open);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <motion.div
            className="absolute inset-0 bg-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="relative w-full max-w-[340px] rounded-[24px] bg-porcelain p-5 text-center shadow-[0_24px_60px_-20px_var(--deep-shadow)]"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <h2 id="confirm-title" className="font-serif text-[20px] font-semibold text-espresso">
              {title}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-warm-grey">{message}</p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button onClick={onCancel} className="rounded-full border border-gold/60 py-2.5 text-[14px] font-semibold text-espresso">
                {cancelLabel}
              </button>
              <button onClick={onConfirm} className="rounded-full bg-forest py-2.5 text-[14px] font-semibold text-cream">
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
