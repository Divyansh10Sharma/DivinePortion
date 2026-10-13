import { fmt } from '../../lib/nutrition';
import type { Meal } from '../../lib/types';
import { MealPhoto } from './MealPhoto';

/** HOME-5: free slot — dashed border, porcelain surface, budget + hint instead of items. */
export function FreeSlotCard({ meal }: { meal: Meal }) {
  return (
    <article className="rounded-[22px] border-[1.5px] border-dashed border-olive/70 bg-porcelain p-3.5 shadow-card">
      <div className="flex items-start gap-3">
        <MealPhoto size={60} />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="font-serif text-[17px] leading-snug font-semibold text-espresso">{meal.name}</h3>
          <span className="mt-1.5 inline-block rounded-full border border-forest/60 px-2.5 py-1 text-[11px] leading-none font-semibold text-forest tabular">
            ~{fmt(meal.freeSlotBudgetKcal ?? 0)} kcal
          </span>
          {meal.freeSlotHint && (
            <p className="mt-2 text-[12.5px] leading-snug text-warm-grey italic">{meal.freeSlotHint}</p>
          )}
        </div>
      </div>
    </article>
  );
}
