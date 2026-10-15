// Settings writes (SET-2, SET-5, theme).

import type { Settings } from '../lib/types';
import { db, type PlateDB } from './db';

export async function updateSettings(edit: (s: Settings) => Settings, database: PlateDB = db): Promise<void> {
  await database.transaction('rw', database.settings, async () => {
    const s = await database.settings.get('settings');
    if (s) await database.settings.put({ ...edit(s), id: 'settings' });
  });
}

export async function dismissBackupBanner(database: PlateDB = db, now = Date.now()): Promise<void> {
  await database.settings.update('settings', { backupBannerDismissedAt: now });
}
