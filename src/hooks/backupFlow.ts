// Export flow state (SET-3, SET-5).
//
// iOS Safari only allows navigator.share() during a fresh user gesture ("transient activation").
// Building the backup (reading every photo) is async and can take a moment, which may use that
// activation up. So export is two taps: "Export backup" prepares the file, then "Save backup file"
// calls share() immediately with the ready-made File.

import { useSyncExternalStore } from 'react';
import { exportAll, markBackedUp } from '../db/backup';
import { backupFileName } from '../lib/backup';

export type ExportState =
  | { kind: 'idle' }
  | { kind: 'preparing' }
  | { kind: 'ready'; file: File; sizeKb: number }
  | { kind: 'error'; message: string };

let state: ExportState = { kind: 'idle' };
const listeners = new Set<() => void>();
const set = (next: ExportState) => {
  state = next;
  listeners.forEach((fn) => fn());
};

export function useExportState(): ExportState {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => state,
    () => state,
  );
}

export async function prepareExport(): Promise<void> {
  if (state.kind === 'preparing') return;
  set({ kind: 'preparing' });
  try {
    const backup = await exportAll();
    const name = backupFileName();
    const file = new File([JSON.stringify(backup)], name, { type: 'application/json' });
    set({ kind: 'ready', file, sizeKb: Math.ceil(file.size / 1024) });
  } catch (e) {
    set({ kind: 'error', message: e instanceof Error ? e.message : 'Export failed' });
  }
}

export function resetExport(): void {
  set({ kind: 'idle' });
}

/**
 * Must be called directly from a tap handler. Uses the share sheet when the browser can share files
 * (iOS → "Save to Files" / iCloud), otherwise downloads via <a download>.
 * Returns 'cancelled' if the owner closed the share sheet (nothing is recorded then).
 */
export async function saveExport(): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (state.kind !== 'ready') return 'cancelled';
  const { file } = state;

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      throw e;
    }
    await markBackedUp();
    set({ kind: 'idle' });
    return 'shared';
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
  await markBackedUp();
  set({ kind: 'idle' });
  return 'downloaded';
}
