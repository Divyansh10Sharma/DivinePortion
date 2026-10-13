// Backup export / import against IndexedDB (SET-3, SET-4).

import { buildBackup, photosFromBackup, type BackupFile } from '../lib/backup';
import { db, type PlateDB } from './db';
import { SCHEMA_VERSION } from './seed';

export async function exportAll(database: PlateDB = db, now = Date.now()): Promise<BackupFile> {
  return database.transaction('r', [database.settings, database.plan, database.dayLogs, database.photos], async () => {
    const [settings, plan, dayLogs, photos] = await Promise.all([
      database.settings.get('settings'),
      database.plan.get('active'),
      database.dayLogs.toArray(),
      database.photos.toArray(),
    ]);
    if (!settings || !plan) throw new Error('Nothing to export yet');
    return buildBackup({ settings, plan, dayLogs, photos }, SCHEMA_VERSION, now);
  });
}

/** SET-4: replaces ALL data in one transaction — if anything fails, nothing changes. */
export async function importAll(backup: BackupFile, database: PlateDB = db): Promise<void> {
  const photos = photosFromBackup(backup);
  await database.transaction('rw', [database.settings, database.plan, database.dayLogs, database.photos], async () => {
    await Promise.all([database.settings.clear(), database.plan.clear(), database.dayLogs.clear(), database.photos.clear()]);
    await database.settings.put({ ...backup.settings, schemaVersion: SCHEMA_VERSION });
    await database.plan.put(backup.plan);
    await database.dayLogs.bulkPut(backup.dayLogs);
    await database.photos.bulkPut(photos);
  });
}

/** SET-3: remember a successful export (drives "Last backup" and the reminder banner). */
export async function markBackedUp(database: PlateDB = db, now = Date.now()): Promise<void> {
  await database.settings.update('settings', { lastBackupAt: now });
}
