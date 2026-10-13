// Tiny toast store (PLAN-8 Undo toasts). One toast at a time: a new one replaces the old,
// which is how iOS-style undo bars behave. Module-level so non-React code can show toasts too.

import { useSyncExternalStore } from 'react';

export interface Toast {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs: number;
}

let current: Toast | null = null;
let seq = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

export function showToast(t: { message: string; actionLabel?: string; onAction?: () => void; durationMs?: number }): void {
  clearTimeout(timer);
  const toast: Toast = { durationMs: 5000, ...t, id: ++seq };
  current = toast;
  emit();
  timer = setTimeout(() => dismissToast(toast.id), toast.durationMs);
}

/** Convenience for deletes: "<what> deleted · Undo" for ~5s. */
export function showUndo(message: string, undo: () => void): void {
  showToast({ message, actionLabel: 'Undo', onAction: undo });
}

export function dismissToast(id?: number): void {
  if (!current || (id !== undefined && current.id !== id)) return;
  clearTimeout(timer);
  current = null;
  emit();
}

export function useToast(): Toast | null {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => current,
    () => null,
  );
}
