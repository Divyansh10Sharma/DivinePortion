import type { ReactNode } from 'react';
import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react';
import { Trash2 } from 'lucide-react';

const REVEAL = 88; // px of red shown when the row is held open
const COMMIT = 140; // swipe further (or flick) to delete straight away

/**
 * ANIM-8 / PLAN-8: swipe a row left to reveal a red "Delete" action (Framer drag on the row, §11.9).
 * - drag past COMMIT (or flick fast) → deletes;
 * - drag past half the reveal → stays open, tap Delete to confirm;
 * - vertical scrolling keeps working: drag is x-only with direction lock (touch-action: pan-y).
 * The caller shows the Undo toast in `onDelete`.
 */
export function SwipeToDelete({
  children,
  onDelete,
  label,
  className = '',
  surfaceClass = 'bg-porcelain',
}: {
  children: ReactNode;
  onDelete: () => void;
  label: string;
  className?: string;
  /** Opaque background of the sliding row (it must hide the red layer underneath). */
  surfaceClass?: string;
}) {
  const x = useMotionValue(0);
  // The red layer fades in as the row moves (opacity only — ANIM-12).
  const revealOpacity = useTransform(x, [-REVEAL, -16, 0], [1, 0.4, 0]);

  function onDragEnd(_: unknown, info: PanInfo) {
    const dx = x.get();
    if (dx < -COMMIT || info.velocity.x < -900) {
      void animate(x, -400, { duration: 0.18 }).then(onDelete);
    } else if (dx < -REVEAL / 2) {
      void animate(x, -REVEAL, { type: 'spring', stiffness: 500, damping: 40 });
    } else {
      void animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 });
    }
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.button
        aria-label={`Delete ${label}`}
        onClick={onDelete}
        style={{ opacity: revealOpacity }}
        className="absolute inset-y-0 right-0 flex w-full items-center justify-end gap-1.5 bg-terracotta pr-5 text-[13px] font-semibold text-white"
      >
        <Trash2 size={16} aria-hidden /> Delete
      </motion.button>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -REVEAL * 2.2, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        style={{ x, touchAction: 'pan-y' }}
        className={`relative ${surfaceClass}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
