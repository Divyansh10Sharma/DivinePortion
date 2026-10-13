import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { mealLogOf, sortedMeals } from '../../lib/dayLog';
import type { DayLog, Meal } from '../../lib/types';
import type { LogActions } from '../../hooks/useLogActions';
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
export function Timeline({
  log,
  nextId,
  selectedId,
  onOpen,
  actions,
}: {
  log: DayLog;
  nextId: string | undefined;
  selectedId: string | null;
  onOpen: (mealId: string) => void;
  actions: LogActions;
}) {
  const meals = sortedMeals(log);

  return (
    <ol className="relative">
      {/* The line: runs through the node centres, behind them. */}
      <motion.div
        aria-hidden
        className="absolute top-[18px] bottom-8 w-[1.5px] origin-top rounded-full bg-forest/70"
        style={{ left: NODE / 2 - 0.75 }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.9 + meals.length * STAGGER_S, ease: [0.22, 1, 0.36, 1] }}
      />

      {meals.map((meal, i) => (
        <MealRow
          key={meal.id}
          index={i}
          meal={meal}
          log={log}
          isNext={meal.id === nextId}
          selected={meal.id === selectedId}
          onOpen={() => onOpen(meal.id)}
          actions={actions}
        />
      ))}
    </ol>
  );
}

function MealRow({
  index,
  meal,
  log,
  isNext,
  selected,
  onOpen,
  actions,
}: {
  index: number;
  meal: Meal;
  log: DayLog;
  isNext: boolean;
  selected: boolean;
  onOpen: () => void;
  actions: LogActions;
}) {
  const status = mealLogOf(log, meal.id).status;

  // ANIM-3: count transitions INTO "eaten" (not the initial render) so the ripple and the card's
  // settle play once per transition, whichever way it was triggered (card button or sheet).
  // This is React's "adjust state while rendering" pattern — no effect needed.
  const [prevStatus, setPrevStatus] = useState(status);
  const [celebrations, setCelebrations] = useState(0);
  if (status !== prevStatus) {
    setPrevStatus(status);
    if (status === 'eaten') setCelebrations((c) => c + 1);
  }

  return (
    <motion.li
      className="relative mb-4 grid grid-cols-[36px_1fr] gap-x-2.5 last:mb-0"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.1 + index * STAGGER_S }}
    >
      <div className="relative flex flex-col items-center pt-1">
        {/* ANIM-3: gentle green ripple from the timeline dot (scale + opacity only). */}
        <AnimatePresence>
          {celebrations > 0 && (
            <motion.span
              key={celebrations}
              aria-hidden
              className="pointer-events-none absolute top-1 z-0 rounded-full bg-forest/35"
              style={{ width: NODE, height: NODE }}
              initial={{ scale: 1, opacity: 0.55 }}
              animate={{ scale: 2.8, opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
        <MealIconNode icon={meal.icon} size={NODE} />
        <time className="relative z-10 mt-1 rounded bg-cream px-0.5 text-[10.5px] font-semibold text-forest tabular">{meal.time}</time>
      </div>
      {meal.isFreeSlot ? (
        <FreeSlotCard meal={meal} log={log} isNext={isNext} selected={selected} settle={celebrations} onOpen={onOpen} />
      ) : (
        <MealCard meal={meal} log={log} isNext={isNext} selected={selected} settle={celebrations} onOpen={onOpen} actions={actions} />
      )}
    </motion.li>
  );
}
