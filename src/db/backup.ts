// Backup export / import against IndexedDB (SET-3, SET-4).

import { buildBackup, photosFromBackup, type BackupFile } from '../lib/backup';
import { newId } from '../lib/ids';
import { migrateMealsToLibrary } from '../lib/library';
import { db, type PlateDB } from './db';
import { SCHEMA_VERSION } from './seed';

export async function exportAll(database: PlateDB = db, now = Date.now()): Promise<BackupFile> {
  const tables = [database.settings, database.plan, database.dayLogs, database.photos, database.library, database.savedPlans];
  return database.transaction('r', tables, async () => {
    const [settings, plan, dayLogs, photos, library, savedPlans] = await Promise.all([
      database.settings.get('settings'),
      database.plan.get('active'),
      database.dayLogs.toArray(),
      database.photos.toArray(),
      database.library.toArray(),
      database.savedPlans.toArray(),
    ]);
    if (!settings || !plan) throw new Error('Nothing to export yet');
    return buildBackup({ settings, plan, dayLogs, photos, library, savedPlans }, SCHEMA_VERSION, now);
  });
}

/**
 * SET-4: replaces ALL data in one transaction — if anything fails, nothing changes.
 * A v1 backup (no library) gets the same per-100 → "Your items" conversion as the v2 upgrade.
 */
export async function importAll(backup: BackupFile, database: PlateDB = db, now = Date.now()): Promise<void> {
  const photos = photosFromBackup(backup);
  let plan = backup.plan;
  let library = backup.library ?? [];
  if (backup.schemaVersion < 2) {
    const migrated = migrateMealsToLibrary(plan.meals, library, newId, now);
    plan = { ...plan, meals: migrated.meals };
    library = migrated.library;
  }
  const tables = [database.settings, database.plan, database.dayLogs, database.photos, database.library, database.savedPlans];
  await database.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()));
    await database.settings.put({ ...backup.settings, schemaVersion: SCHEMA_VERSION });
    await database.plan.put(plan);
    await database.dayLogs.bulkPut(backup.dayLogs);
    await database.photos.bulkPut(photos);
    await database.library.bulkPut(library);
    await database.savedPlans.bulkPut(backup.savedPlans ?? []);
  });
}

/** SET-3: remember a successful export (drives "Last backup" and the reminder banner). */
export async function markBackedUp(database: PlateDB = db, now = Date.now()): Promise<void> {
  await database.settings.update('settings', { lastBackupAt: now });
}
