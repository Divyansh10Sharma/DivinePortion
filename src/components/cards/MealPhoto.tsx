import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useScrollContainer } from '../../hooks/scrollContainer';
import { PhotoView } from '../photos/PhotoView';

const PARALLAX_PX = 5; // ANIM-10: "a few px only"

/**
 * White circular "plate" frame with a subtle rim (§6.3).
 * Shows the meal's photo (PHOTO-1…4), or the porcelain placeholder when there is none (PHOTO-5).
 * - `layoutId` lets the photo fly between the card and the detail sheet (ANIM-5).
 * - `parallax` (ANIM-10): while the Today poster scrolls, the photo drifts a few px inside its frame
 *   (translateY only, scaled up slightly so the edges never show). Off under reduced motion.
 */
export function MealPhoto({
  photoId,
  size = 64,
  layoutId,
  parallax = false,
}: {
  photoId?: string | undefined;
  size?: number;
  layoutId?: string | undefined;
  parallax?: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const container = useScrollContainer();
  const reduced = useReducedMotion();
  const active = parallax && !!container && !reduced;
  // Progress 0 → 1 as the frame travels from the bottom of the scroll container to the top.
  const { scrollYProgress } = useScroll({
    container: active ? (container ?? undefined) : undefined,
    target: active ? frame : undefined,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [PARALLAX_PX, -PARALLAX_PX]);

  return (
    <motion.div layoutId={layoutId} className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        ref={frame}
        className="h-full w-full overflow-hidden rounded-full bg-porcelain p-[3px] shadow-[0_1px_2px_rgb(42_36_32/0.08),0_6px_14px_-6px_rgb(42_36_32/0.18)] ring-1 ring-rim"
      >
        <div className="h-full w-full overflow-hidden rounded-full">
          <motion.div className="h-full w-full" style={active ? { y, scale: 1.14 } : undefined}>
            <PhotoView photoId={photoId} size={size - 6} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
