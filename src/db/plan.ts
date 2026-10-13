// Plan persistence + PLAN-9 (plan changes apply from today onward).

import { localDateKey } from '../lib/dates';
import { mergePlanIntoDayLog, planChangeForToday } from '../lib/planMerge';
import type { Plan } from '../lib/types';
import { db, type PlateDB } from './db';

export type TodaySync = 'synced' | 'ask' | 'no-log';

/**
 * Applies a pure edit to the active plan. In the same transaction, today's log is silently
 * re-snapshotted if it has no logging activity; otherwise 'ask' is returned so the UI can prompt
 * "Apply these plan changes to today too?" (handled by usePlanSync). Past days are never touched.
 */
export async function updatePlan(
  edit: (plan: Plan) => Plan,
  database: PlateDB = db,
  today = localDateKey(),
  now = Date.now(),
): Promise<TodaySync> {
  return database.transaction('rw', [database.plan, database.dayLogs], async () => {
    const plan = await database.plan.get('active');
    if (!plan) throw new Error('No active plan');
    const next: Plan = { ...edit(plan), id: 'active', updatedAt: now };
    await database.plan.put(next);

    const log = await database.dayLogs.get(today);
    if (!log) return 'no-log';
    const result = planChangeForToday(log, next, now);
    if (result.kind === 'ask') return 'ask';
    await database.dayLogs.put(result.log);
    return 'synced';
  });
}

/** "Yes" to the PLAN-9 prompt: merge the current plan into today's log, keeping eaten state. */
export async function applyPlanToToday(database: PlateDB = db, today = localDateKey(), now = Date.now()): Promise<void> {
  await database.transaction('rw', [database.plan, database.dayLogs], async () => {
    const [plan, log] = await Promise.all([database.plan.get('active'), database.dayLogs.get(today)]);
    if (!plan || !log) return;
    await database.dayLogs.put(mergePlanIntoDayLog(log, plan, now));
  });
}

/** Today's snapshot differs from the plan? (Used to decide whether the prompt is still needed.) */
export async function todayDiffersFromPlan(database: PlateDB = db, today = localDateKey()): Promise<boolean> {
  const [plan, log] = await Promise.all([database.plan.get('active'), database.dayLogs.get(today)]);
  if (!plan || !log) return false;
  // The snapshot is a structuredClone of plan.meals, so key order matches and JSON comparison is exact.
  return JSON.stringify(plan.meals) !== JSON.stringify(log.mealsSnapshot);
}
