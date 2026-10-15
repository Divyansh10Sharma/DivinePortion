import { useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useUiLock } from '../../lib/uiLocks';
import { fieldClass } from '../inputs/TextInput';

/** Small centred dialog asking for one line of text (e.g. a saved plan's name). */
export function PromptDialog({
  open,
  title,
  message,
  placeholder,
  initialValue = '',
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  useUiLock(open);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <motion.div className="absolute inset-0 bg-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-[340px] rounded-[24px] bg-porcelain p-5 shadow-[0_24px_60px_-20px_var(--deep-shadow)]"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <PromptForm
              title={title}
              message={message}
              placeholder={placeholder}
              initialValue={initialValue}
              confirmLabel={confirmLabel}
              onConfirm={onConfirm}
              onCancel={onCancel}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function PromptForm({
  title,
  message,
  placeholder,
  initialValue,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string | undefined;
  placeholder: string | undefined;
  initialValue: string;
  confirmLabel: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const ok = value.trim().length > 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (ok) onConfirm(value.trim());
  }

  return (
    <form onSubmit={submit}>
      <h2 className="text-center font-serif text-[20px] font-semibold text-espresso">{title}</h2>
      {message && <p className="mt-1.5 text-center text-[13.5px] leading-relaxed text-warm-grey">{message}</p>}
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={title}
        enterKeyHint="done"
        className={`${fieldClass} mt-4`}
      />
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button type="button" onClick={onCancel} className="rounded-full border border-gold/60 py-2.5 text-[14px] font-semibold text-espresso">
          Cancel
        </button>
        <button type="submit" disabled={!ok} className="rounded-full bg-forest py-2.5 text-[14px] font-semibold text-cream disabled:opacity-40">
          {confirmLabel}
        </button>
      </div>
    </form>
  );
}
