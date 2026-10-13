import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';
import { useUiLock } from '../../lib/uiLocks';

const DISMISS_OFFSET = 110; // px dragged down
const DISMISS_VELOCITY = 600; // px/s flick

/**
 * Bottom sheet (ANIM-6, basic):
 * - springs up from the bottom, backdrop fades;
 * - drag the handle/header down to dismiss (by distance or flick velocity); dragging up past the top
 *   rubber-bands with strong resistance;
 * - while open it holds a UI lock → the screen behind stops scrolling (IOS-6) and SW updates wait (IOS-11).
 * Rendered in a portal on <body> so transformed ancestors (animated timeline rows) can't break `position: fixed`.
 */
export function BottomSheet({
  open,
  onClose,
  label,
  header,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  /** Drag area at the top of the sheet (below the grab handle). */
  header?: ReactNode;
  children: ReactNode;
}) {
  useUiLock(open);
  const controls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) onClose();
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="presentation">
          <motion.div
            className="absolute inset-0 bg-espresso/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[480px] flex-col rounded-t-[28px] bg-porcelain shadow-[0_-12px_40px_-12px_rgb(42_36_32/0.35)]"
            style={{
              maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 24px)',
              paddingLeft: 'env(safe-area-inset-left)',
              paddingRight: 'env(safe-area-inset-right)',
            }}
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            // Strong resistance upwards (rubber band), almost 1:1 downwards so it follows the finger.
            dragElastic={{ top: 0.05, bottom: 0.9 }}
            onDragEnd={onDragEnd}
          >
            {/* Drag area: only the handle + header start a drag, so the content below scrolls normally. */}
            <div className="shrink-0 touch-none" onPointerDown={(e) => controls.start(e)}>
              <div className="flex justify-center pt-2.5 pb-1.5">
                <span className="h-1.5 w-10 rounded-full bg-warm-grey/35" />
              </div>
              {header}
            </div>
            <div
              className="scroll-area min-h-0 flex-1 px-4"
              style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
            >
              {children}
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
