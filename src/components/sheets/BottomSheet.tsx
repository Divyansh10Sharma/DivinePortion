import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, useMotionValue, useReducedMotion, useTransform, type PanInfo } from 'motion/react';
import { useUiLock } from '../../lib/uiLocks';

const DISMISS_OFFSET = 110; // px dragged down
const DISMISS_VELOCITY = 600; // px/s flick
const SPRING = { type: 'spring', stiffness: 380, damping: 38 } as const;

/**
 * Bottom sheet (ANIM-5, ANIM-6):
 * - Without `layoutId` it springs up from the bottom. With `layoutId`, its porcelain surface is a
 *   shared-layout element: the tapped card's surface (same layoutId) morphs into the sheet — position,
 *   size and corner radius — while the content fades in. On close it morphs back into the card.
 * - Drag the handle/header down to dismiss (distance or flick velocity); dragging up past the top
 *   rubber-bands with strong resistance; the backdrop fades as the sheet is pulled down.
 * - While open it holds a UI lock → the screen behind stops scrolling (IOS-6) and SW updates wait (IOS-11).
 * Rendered in a portal on <body> so transformed ancestors (animated timeline rows) can't break `position: fixed`.
 */
export function BottomSheet({
  open,
  onClose,
  label,
  header,
  layoutId,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  /** Drag area at the top of the sheet (below the grab handle). */
  header?: ReactNode;
  /** Shared-layout id of the card this sheet expands from (ANIM-5). */
  layoutId?: string;
  children: ReactNode;
}) {
  useUiLock(open);
  const controls = useDragControls();
  const reduced = useReducedMotion();
  // Drag offset → backdrop opacity (ANIM-6). Only transform/opacity change (ANIM-12).
  const dragY = useMotionValue(0);
  const backdropFade = useTransform(dragY, [0, 420], [1, 0]);

  useEffect(() => {
    if (!open) return;
    dragY.set(0);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, dragY]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) onClose();
  }

  // With a shared surface the sheet itself doesn't slide; the surface morph is the motion.
  const morph = !!layoutId && !reduced;
  const offscreen = typeof window === 'undefined' ? 800 : window.innerHeight;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="presentation">
          <motion.div className="absolute inset-0" style={{ opacity: backdropFade }}>
            <motion.div
              className="absolute inset-0 bg-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={onClose}
            />
          </motion.div>
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[480px] flex-col"
            style={{
              y: dragY,
              maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 24px)',
              paddingLeft: 'env(safe-area-inset-left)',
              paddingRight: 'env(safe-area-inset-right)',
            }}
            // ANIM-11: with reduced motion the sheet just fades (MotionConfig drops the y slide).
            initial={morph ? false : reduced ? { opacity: 0 } : { y: offscreen }}
            animate={{ y: 0, opacity: 1 }}
            exit={morph ? { y: 0 } : reduced ? { opacity: 0 } : { y: offscreen }}
            transition={SPRING}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            // Strong resistance upwards (rubber band), almost 1:1 downwards so it follows the finger.
            dragElastic={{ top: 0.05, bottom: 0.9 }}
            onDragEnd={onDragEnd}
          >
            {/* The sheet surface. borderRadius lives in `style` so motion can correct it during the morph. */}
            <motion.div
              aria-hidden
              layoutId={morph ? layoutId : undefined}
              className="absolute inset-0 bg-porcelain shadow-[0_-12px_40px_-12px_var(--deep-shadow)]"
              style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
              transition={SPRING}
            />
            <motion.div
              className="relative flex min-h-0 flex-1 flex-col"
              initial={{ opacity: morph ? 0 : 1 }}
              animate={{ opacity: 1, transition: { duration: 0.22, delay: morph ? 0.12 : 0 } }}
              exit={{ opacity: morph ? 0 : 1, transition: { duration: 0.12 } }}
            >
              {/* Drag area: only the handle + header start a drag, so the content below scrolls normally. */}
              <div className="shrink-0 touch-none" onPointerDown={(e) => controls.start(e)}>
                <div className="flex justify-center pt-2.5 pb-1.5">
                  <span className="h-1.5 w-10 rounded-full bg-warm-grey/35" />
                </div>
                {header}
              </div>
              <div className="scroll-area min-h-0 flex-1 px-4" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
                {children}
              </div>
            </motion.div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
