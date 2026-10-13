import { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedIfEmpty } from './db/db';
import { deleteOrphanPhotos } from './db/photos';
import { requestPersistentStorage } from './lib/storage';
import { useActiveTab, TABS, type Tab } from './hooks/useActiveTab';
import { useToday } from './hooks/useToday';
import { useUiLocked } from './lib/uiLocks';
import { TabBar, TAB_BAR_HEIGHT } from './components/nav/TabBar';
import { TodayScreen } from './screens/TodayScreen';
import { PlanScreen } from './screens/PlanScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { applyPlanToToday, todayDiffersFromPlan } from './db/plan';
import { setPlanChangePending, usePlanChangePending } from './hooks/planSync';
import { Toaster } from './components/toast/Toaster';
import { ConfirmDialog } from './components/dialog/ConfirmDialog';
import { ComingSoon, ScreenShell } from './screens/PlaceholderScreen';

/** Launch work: seed the DB if empty (§5), request persistent storage (IOS-10), clean up orphan photos (PHOTO-6). */
function useBootstrap(): { ready: boolean; error: string | null } {
  const [state, setState] = useState<{ ready: boolean; error: string | null }>({ ready: false, error: null });
  useEffect(() => {
    let alive = true;
    seedIfEmpty()
      .then(() => {
        if (alive) setState({ ready: true, error: null });
        // PHOTO-6: remove photos nothing references any more (never ones used by past days).
        void deleteOrphanPhotos().catch(() => {});
      })
      .catch((e: unknown) => alive && setState({ ready: false, error: String(e) }));
    void requestPersistentStorage();
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

export default function App() {
  const { ready, error } = useBootstrap();
  const [tab, setTab] = useActiveTab();
  const plan = useLiveQuery(() => (ready ? db.plan.get('active') : undefined), [ready]);
  const settings = useLiveQuery(() => (ready ? db.settings.get('settings') : undefined), [ready]);
  const today = useToday(ready);
  const locked = useUiLocked();
  const planChangePending = usePlanChangePending();
  const [askApplyToToday, setAskApplyToToday] = useState(false);

  // PLAN-9: when leaving the Plan tab after edits that couldn't be synced silently (today already
  // has logging activity), ask whether to apply them to today. Skip if today already matches.
  function changeTab(next: Tab) {
    if (tab === 'plan' && next !== 'plan' && planChangePending) {
      void todayDiffersFromPlan().then((differs) => (differs ? setAskApplyToToday(true) : setPlanChangePending(false)));
    }
    setTab(next);
  }

  function answerApplyToToday(apply: boolean) {
    setAskApplyToToday(false);
    setPlanChangePending(false);
    if (apply) void applyPlanToToday();
  }

  function renderScreen(t: Tab) {
    switch (t) {
      case 'today':
        return plan && settings && today.log ? (
          <TodayScreen plan={plan} settings={settings} log={today.log} date={today.date} now={today.now} />
        ) : null;
      case 'history':
        return (
          <ScreenShell title="History">
            <ComingSoon phase={5} what="the calendar and past days" />
          </ScreenShell>
        );
      case 'plan':
        return plan ? <PlanScreen plan={plan} /> : null;
      case 'settings':
        return <SettingsScreen />;
    }
  }

  return (
    // ANIM-11: honour the OS "Reduce Motion" setting — transforms are dropped, opacity fades remain.
    <MotionConfig reducedMotion="user">
      <div
        className="relative h-full overflow-hidden"
        style={{ paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
      >
        {/* IOS-2: solid cream under the status bar so scrolled content never collides with the clock. */}
        <div aria-hidden className="absolute inset-x-0 top-0 z-20 bg-cream" style={{ height: 'env(safe-area-inset-top)' }} />

        {error && (
          <p className="p-6 pt-16 text-center text-terracotta">Could not open the on-device database: {error}</p>
        )}

        {/* IOS-6: every tab is its own scroll container; all stay mounted so scroll position is kept. */}
        {TABS.map((t) => (
          <main
            key={t}
            hidden={t !== tab}
            className="scroll-area absolute inset-0"
            style={{
              // IOS-6: while a bottom sheet is open the screen behind it must not scroll.
              overflowY: locked ? 'hidden' : undefined,
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: `calc(${TAB_BAR_HEIGHT + 24}px + env(safe-area-inset-bottom))`,
            }}
          >
            {renderScreen(t)}
          </main>
        ))}

        <TabBar active={tab} onChange={changeTab} />
      </div>

      <Toaster />
      <ConfirmDialog
        open={askApplyToToday}
        title="Apply these plan changes to today too?"
        message="You've already logged meals today. Yes updates today and keeps what you've marked eaten; No leaves today as it is (the changes start tomorrow)."
        confirmLabel="Yes, apply"
        cancelLabel="No"
        onConfirm={() => answerApplyToToday(true)}
        onCancel={() => answerApplyToToday(false)}
      />
    </MotionConfig>
  );
}
