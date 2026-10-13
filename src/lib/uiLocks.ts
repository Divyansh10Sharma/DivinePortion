// Tracks whether any bottom sheet / editor is open. Used by:
// - swUpdate.ts (IOS-11): never reload for a service-worker update while something is being edited.
// - App (IOS-6): the screen behind an open sheet stops scrolling.

import { useEffect, useSyncExternalStore } from 'react';

let openCount = 0;
const listeners = new Set<() => void>();

export function hasOpenUiLocks(): boolean {
  return openCount > 0;
}

export function onUiLocksChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function acquire(): () => void {
  openCount++;
  listeners.forEach((fn) => fn());
  let released = false;
  return () => {
    if (released) return;
    released = true;
    openCount--;
    listeners.forEach((fn) => fn());
  };
}

/** Holds a UI lock while `active` is true (e.g. while a sheet is mounted/open). */
export function useUiLock(active: boolean): void {
  useEffect(() => (active ? acquire() : undefined), [active]);
}

/** True while any sheet/editor holds a lock. */
export function useUiLocked(): boolean {
  return useSyncExternalStore(onUiLocksChange, hasOpenUiLocks, () => false);
}
