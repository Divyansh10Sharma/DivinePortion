// Tracks whether any bottom sheet / editor is open. Used by:
// - swUpdate.ts (IOS-11): never reload for a service-worker update while something is being edited.
// - Sheets (IOS-6): lock background scroll while open.

import { useEffect } from 'react';

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
