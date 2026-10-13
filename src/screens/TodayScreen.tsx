import { useMemo } from 'react';
import { plannedMeals, plannedWithSnack } from '../lib/nutrition';
import type { Plan, Settings } from '../lib/types';
import { PosterHeader } from '../components/poster/PosterHeader';
import { DayTotalsBar } from '../components/poster/DayTotalsBar';
import { PosterFooter } from '../components/poster/PosterFooter';
import { Timeline } from '../components/timeline/Timeline';

/** HOME-1: today's plan as a vertical designed poster (read-only in Phase 1). */
export function TodayScreen({ plan, settings }: { plan: Plan; settings: Settings }) {
  const totals = useMemo(
    () => ({ meals: plannedMeals(plan.meals), withSnack: plannedWithSnack(plan.meals) }),
    [plan.meals],
  );

  return (
    <div className="mx-auto max-w-[480px]">
      <PosterHeader kcal={totals.withSnack.kcal} protein={totals.meals.protein} title={plan.title} />
      <div className="px-4">
        <Timeline meals={plan.meals} />
        <div className="mt-6">
          <DayTotalsBar meals={totals.meals} withSnackKcal={totals.withSnack.kcal} />
        </div>
        <PosterFooter items={settings.footerItems} />
      </div>
    </div>
  );
}
