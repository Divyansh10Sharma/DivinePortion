import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { TAB_BAR_HEIGHT } from '../nav/TabBar';
import { dismissToast, useToast } from './toastStore';

/** Renders the current toast above the tab bar (and above sheets), clear of the home indicator. */
export function Toaster() {
  const toast = useToast();

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-4"
      style={{ bottom: `calc(${TAB_BAR_HEIGHT + 12}px + env(safe-area-inset-bottom))` }}
      aria-live="polite"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-[440px] items-center gap-3 rounded-2xl bg-toast py-2.5 pr-2 pl-4 text-[14px] text-toast-fg shadow-[0_10px_30px_-10px_rgb(42_36_32/0.5)]"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          >
            <span className="min-w-0 flex-1 truncate">{toast.message}</span>
            {toast.actionLabel && (
              <button
                onClick={() => {
                  toast.onAction?.();
                  dismissToast(toast.id);
                }}
                className="shrink-0 rounded-xl px-3 py-1.5 font-semibold text-toast-action active:opacity-70"
              >
                {toast.actionLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
