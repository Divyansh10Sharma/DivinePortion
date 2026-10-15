import { useEffect, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedIfEmpty } from './db/db';
import { deleteOrphanPhotos } from './db/photos';
import { requestPersistentStorage } from './lib/storage';
import { applyTheme, DEFAULT_THEME } from './lib/theme';
import { useActiveTab, TABS, type Tab } from './hooks/useActiveTab';
import { prepareExport } from './hooks/backupFlow';
import { ScrollContainerContext } from './hooks/scrollContainer';
import { useUiLocked } from './lib/uiLocks';
import { TabBar, TAB_BAR_HEIGHT } from './components/nav/TabBar';
import { Toaster } from './components/toast/Toaster';
import { TodayScreen } from './screens/TodayScreen';
import { PlansScreen } from './screens/PlansScreen';
import { MealsScreen } from './screens/MealsScreen';
import { ItemsScreen } from './screens/ItemsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

/** Launch work: seed the DB if empty (§5), request persistent storage (IOS-10), clean up orphan photos (PHOTO-6). */
function useBootstrap(): { ready: boolean; error: string | null } {
  const [state, setState] = useState<{ ready: boolean; error: string | null }>({ ready: false, error: null });
  useEffect(() => {
    let alive = true;
    seedIfEmpty()
      .then(() => {
        if (alive) setState({ ready: true, error: null });
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

/**
 * v2 redesign (owner request): four sections — Today (current meals + totals), Plans (saved plans),
 * Meals (edit the current meals), Items ("Your items", per 100 g). Settings opens from Today's gear.
 */
export default function App() {
  const { ready, error } = useBootstrap();
  const [tab, setTab] = useActiveTab();
  const plan = useLiveQuery(() => (ready ? db.plan.get('active') : undefined), [ready]);
  const settings = useLiveQuery(() => (ready ? db.settings.get('settings') : undefined), [ready]);
  const library = useLiveQuery(async () => (ready ? db.library.toArray() : undefined), [ready]);
  const savedPlans = useLiveQuery(async () => (ready ? db.savedPlans.toArray() : undefined), [ready]);
  const locked = useUiLocked();
  const todayScroller = useRef<HTMLElement>(null);

  // Theme: Settings is the source of truth (it's also restored by an import); keep the page in sync.
  const theme = settings?.theme ?? DEFAULT_THEME;
  useEffect(() => {
    if (settings) applyTheme(theme);
  }, [settings, theme]);

  function renderScreen(t: Tab) {
    switch (t) {
      case 'today':
        return plan && settings ? (
          <TodayScreen
            plan={plan}
            settings={settings}
            onOpenSettings={() => setTab('settings')}
            onBackupNow={() => {
              setTab('settings');
              void prepareExport();
            }}
          />
        ) : null;
      case 'plans':
        return plan && savedPlans ? <PlansScreen plan={plan} saved={savedPlans} /> : null;
      case 'meals':
        return plan && library ? <MealsScreen plan={plan} library={library} /> : null;
      case 'items':
        return library ? <ItemsScreen items={library} /> : null;
      case 'settings':
        return settings ? <SettingsScreen settings={settings} onBack={() => setTab('today')} /> : null;
    }
  }

  return (
    // ANIM-11: honour the OS "Reduce Motion" setting — transforms are dropped, opacity fades remain.
    <MotionConfig reducedMotion="user">
      <div
        className="relative h-full overflow-hidden"
        style={{ paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
      >
        {/* IOS-2: a frosted strip under the status bar so scrolled content never collides with the clock. */}
        <div aria-hidden className="frosted absolute inset-x-0 top-0 z-20" style={{ height: 'env(safe-area-inset-top)' }} />

        {error && <p className="p-6 pt-16 text-center text-terracotta">Could not open the on-device database: {error}</p>}

        {/* IOS-6: every tab is its own scroll container; all stay mounted so scroll position is kept. */}
        {TABS.map((t) => (
          <main
            key={t}
            ref={t === 'today' ? todayScroller : undefined}
            hidden={t !== tab}
            className="scroll-area absolute inset-0"
            style={{
              // IOS-6: while a bottom sheet is open the screen behind it must not scroll.
              overflowY: locked ? 'hidden' : undefined,
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: `calc(${TAB_BAR_HEIGHT + 24}px + env(safe-area-inset-bottom))`,
            }}
          >
            {t === 'today' ? (
              <ScrollContainerContext.Provider value={todayScroller}>{renderScreen(t)}</ScrollContainerContext.Provider>
            ) : (
              renderScreen(t)
            )}
          </main>
        ))}

        <TabBar active={tab} onChange={setTab} />
      </div>

      <Toaster />
    </MotionConfig>
  );
}
