import { fmt } from '../../lib/nutrition';
import type { Nutrition } from '../../lib/types';

/** HOME-7: forest-green bar — meals-only totals, then a smaller "With snack" line. */
export function DayTotalsBar({ meals, withSnackKcal }: { meals: Nutrition; withSnackKcal: number }) {
  return (
    <section className="rounded-[20px] bg-forest px-4 py-3.5 text-center text-white shadow-card" aria-label="Day totals">
      <p className="text-[10px] font-semibold tracking-[0.18em] text-cream/70 uppercase">Day Total · Meals</p>
      <p className="mt-1 text-[13px] leading-snug font-bold tracking-[-0.01em] tabular">
        {fmt(meals.kcal)} kcal · {fmt(meals.protein)}g P · {fmt(meals.carbs)}g C · {fmt(meals.fat)}g F ·{' '}
        {fmt(meals.fibre)}g Fibre
      </p>
      <p className="mt-1 text-[12px] font-medium text-cream/85 tabular">With snack: {fmt(withSnackKcal)} kcal</p>
    </section>
  );
}
