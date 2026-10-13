import { motion } from 'motion/react';
import type { Meal } from '../../lib/types';
import { MealIconNode } from '../icons/icons';
import { FreeSlotCard } from '../cards/FreeSlotCard';
import { MealCard } from '../cards/MealCard';

const NODE = 36;
const STAGGER_S = 0.07; // ANIM-1: 60–80ms between cards

/**
 * Vertical timeline of meal cards (HOME-1, §6.3).
 * ANIM-1: the line draws top→bottom (scaleY from the top) while cards fade + rise, staggered.
 * Under reduced motion (ANIM-11) MotionConfig strips the transforms and only opacity fades remain.
 */
export function Timeline({ meals }: { meals: Meal[] }) {
  const sorted = [...meals].sort((a, b) => a.order - b.order);

  return (
    <ol className="relative">
      {/* The line: runs through the node centres, behind them. */}
      <motion.div
        aria-hidden
        className="absolute top-[18px] bottom-8 w-[1.5px] origin-top rounded-full bg-forest/70"
        style={{ left: NODE / 2 - 0.75 }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.9 + sorted.length * STAGGER_S, ease: [0.22, 1, 0.36, 1] }}
      />

      {sorted.map((meal, i) => (
        <motion.li
          key={meal.id}
          className="relative mb-4 grid grid-cols-[36px_1fr] gap-x-2.5 last:mb-0"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.1 + i * STAGGER_S }}
        >
          <div className="flex flex-col items-center pt-1">
            <MealIconNode icon={meal.icon} size={NODE} />
            <time className="relative z-10 mt-1 rounded bg-cream px-0.5 text-[10.5px] font-semibold text-forest tabular">
              {meal.time}
            </time>
          </div>
          {meal.isFreeSlot ? <FreeSlotCard meal={meal} /> : <MealCard meal={meal} />}
        </motion.li>
      ))}
    </ol>
  );
}
