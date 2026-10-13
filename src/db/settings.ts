// Settings writes (SET-1, SET-2, SET-5) and "reset today" (LOG-8 / SET-6).

import { createDayLog } from '../lib/dayLog';
import { localDateKey } from '../lib/dates';
import type { Settings, Targets } from '../lib/types';
import { db, type PlateDB } from './db';

export async function updateSettings(edit: (s: Settings) => Settings, database: PlateDB = db): Promise<void> {
  await database.transaction('rw', database.settings, async () => {
    const s = await database.settings.get('settings');
    if (s) await database.settings.put({ ...edit(s), id: 'settings' });
  });
}

/**
 * SET-1: new targets apply from today onward — like plan changes. Today's log gets the new
 * targets too (so the rings update); past days keep the targets that applied then (HIST-2).
 */
export async function updateTargets(edit: (t: Targets) => Targets, database: PlateDB = db, today = localDateKey()): Promise<void> {
  await database.transaction('rw', [database.settings, database.dayLogs], async () => {
    const s = await database.settings.get('settings');
    if (!s) return;
    const targets = edit(s.targets);
    await database.settings.put({ ...s, targets });
    const log = await database.dayLogs.get(today);
    if (log) await database.dayLogs.put({ ...log, targetsSnapshot: { ...targets }, updatedAt: Date.now() });
  });
}

/** LOG-8: re-snapshot today from the current plan + targets, clearing eaten state, extras and entries. */
export async function resetToday(database: PlateDB = db, today = localDateKey(), now = Date.now()): Promise<void> {
  await database.transaction('rw', [database.settings, database.plan, database.dayLogs], async () => {
    const [plan, settings, old] = await Promise.all([database.plan.get('active'), database.settings.get('settings'), database.dayLogs.get(today)]);
    if (!plan || !settings) return;
    const fresh = createDayLog(today, plan, settings.targets, now);
    await database.dayLogs.put(old ? { ...fresh, createdAt: old.createdAt } : fresh);
  });
}

export async function dismissBackupBanner(database: PlateDB = db, now = Date.now()): Promise<void> {
  await database.settings.update('settings', { backupBannerDismissedAt: now });
}
