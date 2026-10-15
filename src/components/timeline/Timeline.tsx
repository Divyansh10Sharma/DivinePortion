import { motion } from 'motion/react';
import { byOrder } from '../../lib/planEdit';
import type { Meal } from '../../lib/types';
import { FreeSlotCard } from '../cards/FreeSlotCard';
import { MealCard } from '../cards/MealCard';

const STAGGER_S = 0.07; // ANIM-1: 60–80ms between cards

/**
 * Vertical timeline of meal cards (HOME-1, §6.3). v2: meal icons were dropped (owner request),
 * so each node is a small forest dot with the time under it.
 * ANIM-1: the line draws top→bottom while cards fade + rise, staggered.
 */
export function Timeline({ meals }: { meals: Meal[] }) {
  const sorted = byOrder(meals);

  return (
    <ol className="relative">
      <motion.div
        aria-hidden
        className="absolute top-3 bottom-8 left-[17px] w-[1.5px] origin-top rounded-full bg-forest/70"
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
          <div className="flex flex-col items-center pt-2">
            <span aria-hidden className="relative z-10 h-3 w-3 rounded-full bg-forest ring-4 ring-cream" />
            <time className="relative z-10 mt-1.5 rounded bg-cream px-0.5 text-[10.5px] font-semibold text-forest tabular">{meal.time}</time>
          </div>
          {meal.isFreeSlot ? <FreeSlotCard meal={meal} /> : <MealCard meal={meal} />}
        </motion.li>
      ))}
    </ol>
  );
}
