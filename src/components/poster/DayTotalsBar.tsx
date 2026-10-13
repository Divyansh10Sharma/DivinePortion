import { AnimatedNumber as N } from '../anim/AnimatedNumber';
import type { Nutrition } from '../../lib/types';

/** HOME-7: forest-green bar — meals-only totals, then a smaller "With snack" line. Numbers count (ANIM-2). */
export function DayTotalsBar({ meals, withSnackKcal }: { meals: Nutrition; withSnackKcal: number }) {
  return (
    <section className="rounded-[20px] bg-forest px-4 py-3.5 text-center text-cream shadow-card" aria-label="Day totals">
      <p className="text-[10px] font-semibold tracking-[0.18em] text-cream/70 uppercase">Day Total · Meals</p>
      <p className="mt-1 text-[13px] leading-snug font-bold tracking-[-0.01em] tabular">
        <N value={meals.kcal} /> kcal · <N value={meals.protein} />g P · <N value={meals.carbs} />g C ·{' '}
        <N value={meals.fat} />g F · <N value={meals.fibre} />g Fibre
      </p>
      <p className="mt-1 text-[12px] font-medium text-cream/85 tabular">With snack: <N value={withSnackKcal} /> kcal</p>
    </section>
  );
}
