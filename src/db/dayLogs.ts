// DayLog persistence. All writes go through a rw transaction so read-modify-write is atomic.

import { createDayLog } from '../lib/dayLog';
import type { DayLog } from '../lib/types';
import { db, type PlateDB } from './db';

/**
 * LOG-1: returns the log for `date`, creating it from the current plan + targets the first time
 * the app is opened that day. Existing logs are never touched (HIST-3: past days are immutable).
 */
export async function ensureDayLog(date: string, database: PlateDB = db, now = Date.now()): Promise<DayLog> {
  return database.transaction('rw', [database.dayLogs, database.plan, database.settings], async () => {
    const existing = await database.dayLogs.get(date);
    if (existing) return existing;
    const [plan, settings] = await Promise.all([database.plan.get('active'), database.settings.get('settings')]);
    if (!plan || !settings) throw new Error('Plan or settings missing — database not seeded');
    const log = createDayLog(date, plan, settings.targets, now);
    await database.dayLogs.put(log);
    return log;
  });
}

/** Applies a pure dayLog.ts mutation to the stored log for `date`. */
export async function updateDayLog(
  date: string,
  mutate: (log: DayLog) => DayLog,
  database: PlateDB = db,
): Promise<void> {
  await database.transaction('rw', database.dayLogs, async () => {
    const log = await database.dayLogs.get(date);
    if (!log) return;
    const next = mutate(log);
    if (next !== log) await database.dayLogs.put(next);
  });
}
