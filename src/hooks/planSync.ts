import { useSyncExternalStore } from 'react';
import { updatePlan } from '../db/plan';
import type { Plan } from '../lib/types';

// PLAN-9 bookkeeping. Plan edits save immediately. When today's log has logging activity the
// change is NOT applied to today; instead a "pending" flag is set, and the owner is asked
// "Apply these plan changes to today too?" when they leave the Plan tab (asking on every
// keystroke would be unbearable). Without activity, today is synced silently in the same write.

let pending = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

export function setPlanChangePending(value: boolean): void {
  if (pending === value) return;
  pending = value;
  emit();
}

export function usePlanChangePending(): boolean {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => pending,
    () => false,
  );
}

/** Saves a pure plan edit and records whether today needs the PLAN-9 prompt. */
export function savePlan(edit: (plan: Plan) => Plan): void {
  void updatePlan(edit).then((result) => {
    if (result === 'ask') setPlanChangePending(true);
  });
}
