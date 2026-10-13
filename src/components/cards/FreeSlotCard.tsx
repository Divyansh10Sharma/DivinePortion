import { entriesOf, freeSlotRemaining, mealLogOf } from '../../lib/dayLog';
import { fmt } from '../../lib/nutrition';
import type { DayLog, Meal } from '../../lib/types';
import { CardShell } from './MealCard';
import { MealPhoto } from './MealPhoto';

/**
 * HOME-5: free slot — dashed border, porcelain surface, budget + hint until something is logged;
 * then the entries and budget remaining / over (LOG-5, over → terracotta).
 */
export function FreeSlotCard({
  meal,
  log,
  isNext,
  selected,
  settle,
  onOpen,
}: {
  meal: Meal;
  log: DayLog;
  isNext: boolean;
  selected: boolean;
  settle: number;
  onOpen: () => void;
}) {
  const entries = entriesOf(log, meal.id);
  const logged = mealLogOf(log, meal.id).status === 'eaten';
  const remaining = freeSlotRemaining(log, meal);
  const over = remaining < 0;

  return (
    <CardShell
      className="rounded-[22px] border-[1.5px] border-dashed border-olive/70 bg-porcelain p-3.5 shadow-card"
      isNext={isNext}
      settle={settle}
      onOpen={onOpen}
      label={meal.name}
    >
      <div className="flex items-start gap-3">
        {selected ? (
          <div style={{ width: 60, height: 60 }} className="shrink-0" />
        ) : (
          <MealPhoto photoId={meal.photoId} size={60} layoutId={`photo-${meal.id}`} eaten={logged} />
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="font-serif text-[17px] leading-snug font-semibold text-espresso">{meal.name}</h3>
          <span className="mt-1.5 inline-block rounded-full border border-forest/60 px-2.5 py-1 text-[11px] leading-none font-semibold text-forest tabular">
            ~{fmt(meal.freeSlotBudgetKcal ?? 0)} kcal
          </span>
          {entries.length === 0 && meal.freeSlotHint && (
            <p className="mt-2 text-[12.5px] leading-snug text-warm-grey italic">{meal.freeSlotHint}</p>
          )}
        </div>
      </div>

      {entries.length > 0 && (
        <>
          <ul className="mt-3 space-y-1 border-t border-gold/35 pt-2.5">
            {entries.map((e) => (
              <li key={e.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="min-w-0 text-espresso">{e.name}</span>
                <span className="shrink-0 text-[10.5px] text-warm-grey tabular">
                  {fmt(e.kcal)} kcal · {fmt(e.fat)}F
                </span>
              </li>
            ))}
          </ul>
          <p className={`mt-2 text-right text-[12.5px] font-semibold tabular ${over ? 'text-terracotta' : 'text-forest'}`}>
            {over ? `${fmt(-remaining)} kcal over budget` : `${fmt(remaining)} kcal remaining`}
          </p>
        </>
      )}

      <div className="mt-3 flex justify-end">
        <button
          onClick={onOpen}
          className="rounded-full border border-forest/50 px-3.5 py-1.5 text-[13px] font-semibold text-forest active:scale-[0.97]"
        >
          {entries.length ? 'Log more' : 'Log snack'}
        </button>
      </div>
    </CardShell>
  );
}
