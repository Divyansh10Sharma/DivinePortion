import { useCallback, useMemo, useState } from 'react';
import { dayTotals, findMeal, nextMealId, targetStatus } from '../lib/dayLog';
import type { DayLog, Plan, Settings } from '../lib/types';
import { useLogActions } from '../hooks/useLogActions';
import { PosterHeader } from '../components/poster/PosterHeader';
import { DayTotalsBar } from '../components/poster/DayTotalsBar';
import { PosterFooter } from '../components/poster/PosterFooter';
import { Timeline } from '../components/timeline/Timeline';
import { TargetsPanel } from '../components/rings/TargetsPanel';
import { MealSheet } from '../components/sheets/MealSheet';

/**
 * HOME-1: today's poster, rendered from today's DayLog snapshot (LOG-1) with logging (LOG-2…7, HOME-9).
 */
export function TodayScreen({
  plan,
  settings,
  log,
  date,
  now,
}: {
  plan: Plan;
  settings: Settings;
  log: DayLog;
  date: string;
  now: Date;
}) {
  const actions = useLogActions(date);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const closeSheet = useCallback(() => setSelectedId(null), []);

  const totals = useMemo(() => dayTotals(log), [log]);
  const status = useMemo(() => targetStatus(log), [log]);
  const nextId = nextMealId(log, now);
  const selectedMeal = selectedId ? findMeal(log, selectedId) : undefined;

  return (
    <div className="mx-auto max-w-[480px]">
      <PosterHeader kcal={totals.plannedWithSnack.kcal} protein={totals.plannedMeals.protein} title={plan.title} />
      <div className="px-4">
        <div className="mb-6">
          <TargetsPanel totals={totals} status={status} />
        </div>
        <Timeline log={log} nextId={nextId} selectedId={selectedId} onOpen={setSelectedId} actions={actions} />
        <div className="mt-6">
          <DayTotalsBar meals={totals.plannedMeals} withSnackKcal={totals.plannedWithSnack.kcal} />
        </div>
        <PosterFooter items={settings.footerItems} />
      </div>

      <MealSheet meal={selectedMeal} log={log} actions={actions} onClose={closeSheet} />
    </div>
  );
}
