import { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedIfEmpty } from './db/db';
import { requestPersistentStorage } from './lib/storage';
import { useActiveTab, TABS, type Tab } from './hooks/useActiveTab';
import { TabBar, TAB_BAR_HEIGHT } from './components/nav/TabBar';
import { TodayScreen } from './screens/TodayScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ComingSoon, ScreenShell } from './screens/PlaceholderScreen';

/** First-launch work: seed the DB if empty (§5) and request persistent storage (IOS-10). */
function useBootstrap(): { ready: boolean; error: string | null } {
  const [state, setState] = useState<{ ready: boolean; error: string | null }>({ ready: false, error: null });
  useEffect(() => {
    let alive = true;
    seedIfEmpty()
      .then(() => alive && setState({ ready: true, error: null }))
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

  function renderScreen(t: Tab) {
    switch (t) {
      case 'today':
        return plan && settings ? <TodayScreen plan={plan} settings={settings} /> : null;
      case 'history':
        return (
          <ScreenShell title="History">
            <ComingSoon phase={5} what="the calendar and past days" />
          </ScreenShell>
        );
      case 'plan':
        return (
          <ScreenShell title="Plan">
            <ComingSoon phase={3} what="the plan editor" />
          </ScreenShell>
        );
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
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: `calc(${TAB_BAR_HEIGHT + 24}px + env(safe-area-inset-bottom))`,
            }}
          >
            {renderScreen(t)}
          </main>
        ))}

        <TabBar active={tab} onChange={setTab} />
      </div>
    </MotionConfig>
  );
}
