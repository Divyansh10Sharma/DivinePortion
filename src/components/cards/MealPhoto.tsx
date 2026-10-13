import { motion } from 'motion/react';
import { DrawnCheck } from '../anim/DrawnCheck';
import { PlatePlaceholder } from './PlatePlaceholder';

/**
 * White circular "plate" frame with a subtle rim (§6.3).
 * Phase 4 adds real photos; until then (and for meals without one) the porcelain placeholder shows.
 * - `layoutId` lets the photo fly between the card and the detail sheet (ANIM-5, basic).
 * - `eaten` (HOME-9): slightly desaturated + a small green check that draws itself.
 */
export function MealPhoto({ size = 64, layoutId, eaten = false }: { size?: number; layoutId?: string; eaten?: boolean }) {
  return (
    <motion.div layoutId={layoutId} className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="h-full w-full overflow-hidden rounded-full bg-porcelain p-[3px] shadow-[0_1px_2px_rgb(42_36_32/0.08),0_6px_14px_-6px_rgb(42_36_32/0.18)] ring-1 ring-[#E4DACA] transition-[filter] duration-500"
        style={{ filter: eaten ? 'saturate(0.6)' : undefined }}
      >
        <div className="h-full w-full overflow-hidden rounded-full">
          <PlatePlaceholder size={size - 6} />
        </div>
      </div>
      {eaten && (
        <span className="absolute -right-0.5 -bottom-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-forest text-cream ring-2 ring-sage">
          <DrawnCheck size={13} />
        </span>
      )}
    </motion.div>
  );
}
