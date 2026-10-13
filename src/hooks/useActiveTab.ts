import { useCallback, useEffect, useState } from 'react';

// NAV-2: state-based navigation with an optional hash (#today, #history, …).
// No router → no server routes → nothing to break offline.

export const TABS = ['today', 'history', 'plan', 'settings'] as const;
export type Tab = (typeof TABS)[number];

function tabFromHash(): Tab {
  const h = window.location.hash.replace('#', '');
  return (TABS as readonly string[]).includes(h) ? (h as Tab) : 'today';
}

export function useActiveTab(): [Tab, (tab: Tab) => void] {
  const [tab, setTabState] = useState<Tab>(tabFromHash);

  useEffect(() => {
    const onHash = () => setTabState(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const setTab = useCallback((next: Tab) => {
    setTabState(next);
    // replaceState: tab switches shouldn't pile up history entries (there's no back button in standalone mode).
    window.history.replaceState(null, '', next === 'today' ? window.location.pathname : `#${next}`);
  }, []);

  return [tab, setTab];
}
