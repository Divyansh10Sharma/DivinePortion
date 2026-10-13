// Dexie (IndexedDB) schema — SPEC.md §4.1. Versioned from day one:
// to change the schema later, add `this.version(2).stores({...}).upgrade(...)` below; never edit version(1).

import Dexie, { type EntityTable } from 'dexie';
import type { DayLog, Photo, Plan, Settings } from '../lib/types';
import { buildSeedPlan, buildSeedSettings } from './seed';

export class PlateDB extends Dexie {
  settings!: EntityTable<Settings, 'id'>;
  plan!: EntityTable<Plan, 'id'>;
  dayLogs!: EntityTable<DayLog, 'date'>;
  photos!: EntityTable<Photo, 'id'>;

  constructor(name = 'plate') {
    super(name);
    this.version(1).stores({
      settings: 'id',
      plan: 'id',
      dayLogs: 'date',
      photos: 'id',
    });
  }
}

export const db = new PlateDB();

/**
 * Seeds settings + plan only if the database is empty (§5: never re-seed over existing data).
 * Runs inside one rw transaction so two tabs racing on first launch can't double-seed.
 * Returns true if seeding happened.
 */
export async function seedIfEmpty(database: PlateDB = db, now = Date.now()): Promise<boolean> {
  return database.transaction('rw', [database.settings, database.plan, database.dayLogs], async () => {
    const [settingsCount, planCount, dayLogCount] = await Promise.all([
      database.settings.count(),
      database.plan.count(),
      database.dayLogs.count(),
    ]);
    if (settingsCount > 0 || planCount > 0 || dayLogCount > 0) return false;
    await database.settings.put(buildSeedSettings(now));
    await database.plan.put(buildSeedPlan(now));
    return true;
  });
}
