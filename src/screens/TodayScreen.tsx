import { useMemo } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { plannedMeals, plannedWithSnack } from '../lib/nutrition';
import { shouldShowBackupBanner } from '../lib/backup';
import type { Plan, Settings } from '../lib/types';
import { dismissBackupBanner } from '../db/settings';
import { PosterHeader } from '../components/poster/PosterHeader';
import { DayTotalsBar } from '../components/poster/DayTotalsBar';
import { PosterFooter } from '../components/poster/PosterFooter';
import { BackupBanner } from '../components/poster/BackupBanner';
import { Timeline } from '../components/timeline/Timeline';

/**
 * Today (v2 redesign, owner request): the current meals as a poster with the total macros on top.
 * No eaten tracking. The gear opens Settings (backup, theme, footer).
 */
export function TodayScreen({
  plan,
  settings,
  onOpenSettings,
  onBackupNow,
}: {
  plan: Plan;
  settings: Settings;
  onOpenSettings: () => void;
  /** SET-5 banner action: go to Settings and start preparing the export. */
  onBackupNow: () => void;
}) {
  const totals = useMemo(() => ({ meals: plannedMeals(plan.meals), withSnack: plannedWithSnack(plan.meals) }), [plan.meals]);

  return (
    <div className="relative mx-auto max-w-[480px]">
      <button
        onClick={onOpenSettings}
        aria-label="Settings"
        className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-forest active:bg-forest/10"
      >
        <SettingsIcon size={21} strokeWidth={1.8} aria-hidden />
      </button>
      <PosterHeader kcal={totals.withSnack.kcal} protein={totals.meals.protein} title={plan.title} />
      {shouldShowBackupBanner(settings) && (
        <BackupBanner lastBackupAt={settings.lastBackupAt} onBackup={onBackupNow} onDismiss={() => void dismissBackupBanner()} />
      )}
      <div className="px-4">
        {/* Total macros on top (owner request). */}
        <div className="mb-6">
          <DayTotalsBar meals={totals.meals} withSnackKcal={totals.withSnack.kcal} />
        </div>
        {plan.meals.length === 0 ? (
          <p className="rounded-[22px] bg-porcelain p-5 text-center text-[14px] text-warm-grey shadow-card">
            No meals yet — add them in the Meals tab.
          </p>
        ) : (
          <Timeline meals={plan.meals} />
        )}
        <PosterFooter items={settings.footerItems} />
      </div>
    </div>
  );
}
