// Dexie (IndexedDB) schema — SPEC.md §4.1. Versioned: never edit an existing version, add a new one.
//
// v1: settings, plan, dayLogs, photos.
// v2 (owner redesign): + library ("Your items", per 100 g) and savedPlans. The upgrade converts the
//     current plan's per-100 items into library items ("Convert what I can"). dayLogs is kept so old
//     data (and photos it references) survives and is still backed up, but nothing writes to it now.

import Dexie, { type EntityTable, type Transaction } from 'dexie';
import { newId } from '../lib/ids';
import { migrateMealsToLibrary } from '../lib/library';
import type { DayLog, LibraryItem, Photo, Plan, SavedPlan, Settings } from '../lib/types';
import { buildSeedPlan, buildSeedSettings } from './seed';

export class PlateDB extends Dexie {
  settings!: EntityTable<Settings, 'id'>;
  plan!: EntityTable<Plan, 'id'>;
  dayLogs!: EntityTable<DayLog, 'date'>;
  photos!: EntityTable<Photo, 'id'>;
  library!: EntityTable<LibraryItem, 'id'>;
  savedPlans!: EntityTable<SavedPlan, 'id'>;

  constructor(name = 'plate') {
    super(name);
    this.version(1).stores({
      settings: 'id',
      plan: 'id',
      dayLogs: 'date',
      photos: 'id',
    });
    this.version(2)
      .stores({ library: 'id', savedPlans: 'id' })
      .upgrade((tx) => migratePlanToLibrary(tx));
  }
}

/** v1 → v2: move per-100 items of the current plan into the library. */
async function migratePlanToLibrary(tx: Transaction, now = Date.now()): Promise<void> {
  const plan = (await tx.table('plan').get('active')) as Plan | undefined;
  if (!plan) return;
  const existing = (await tx.table('library').toArray()) as LibraryItem[];
  const { meals, added } = migrateMealsToLibrary(plan.meals, existing, newId, now);
  if (added.length) await tx.table('library').bulkPut(added);
  await tx.table('plan').put({ ...plan, meals });
}

export const db = new PlateDB();

/**
 * Seeds settings + plan (and the library derived from it) only if the database is empty
 * (§5: never re-seed over existing data). One rw transaction, so two tabs can't double-seed.
 * Returns true if seeding happened.
 */
export async function seedIfEmpty(database: PlateDB = db, now = Date.now()): Promise<boolean> {
  return database.transaction('rw', [database.settings, database.plan, database.dayLogs, database.library], async () => {
    const [settingsCount, planCount, dayLogCount] = await Promise.all([
      database.settings.count(),
      database.plan.count(),
      database.dayLogs.count(),
    ]);
    if (settingsCount > 0 || planCount > 0 || dayLogCount > 0) return false;
    const plan = buildSeedPlan(now);
    const { meals, added } = migrateMealsToLibrary(plan.meals, [], newId, now);
    await database.settings.put(buildSeedSettings(now));
    await database.plan.put({ ...plan, meals });
    await database.library.bulkPut(added);
    return true;
  });
}
