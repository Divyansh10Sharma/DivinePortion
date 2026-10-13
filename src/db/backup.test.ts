import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { addExtraItem, addFreeSlotEntry, makeLoggedItem, markMealEaten, setItemAmount } from '../lib/dayLog';
import { updateMeal } from '../lib/planEdit';
import {
  arrayBufferToBase64,
  backupFileName,
  base64ToArrayBuffer,
  lastBackupLabel,
  parseBackup,
  shouldShowBackupBanner,
  validateBackup,
} from '../lib/backup';
import { exportAll, importAll } from './backup';
import { PlateDB, seedIfEmpty } from './db';
import { ensureDayLog, updateDayLog } from './dayLogs';
import { savePhoto } from './photos';
import { updatePlan } from './plan';

const DAY = 86_400_000;
const bytes = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf));

async function snapshot(d: PlateDB) {
  const [settings, plan, dayLogs, photos] = await Promise.all([d.settings.toArray(), d.plan.toArray(), d.dayLogs.toArray(), d.photos.toArray()]);
  // ArrayBuffers → byte arrays so deep-equal compares contents.
  return { settings, plan, dayLogs, photos: photos.map((p) => ({ ...p, data: bytes(p.data) })) };
}

describe('backup round-trip (Phase 5)', () => {
  const dbs: PlateDB[] = [];
  afterEach(async () => {
    await Promise.all(dbs.map((d) => d.delete()));
    dbs.length = 0;
  });
  const fresh = () => {
    const d = new PlateDB(`test-${crypto.randomUUID()}`);
    dbs.push(d);
    return d;
  };

  it('export → wipe → import gives back exactly the same data, photos included', async () => {
    const d = fresh();
    await seedIfEmpty(d, 1);
    const big = new Uint8Array(200_000).map((_, i) => (i * 7) % 256); // exercises chunked base64
    const mealPhoto = await savePhoto({ data: big.buffer, mimeType: 'image/jpeg', width: 1000, height: 750, thumbDataUrl: 'data:image/jpeg;base64,AAAA' }, d, 5);
    const entryPhoto = await savePhoto({ data: new Uint8Array([1, 2, 3]).buffer, mimeType: 'image/png', width: 3, height: 1, thumbDataUrl: 'data:,' }, d, 6);
    await updatePlan((p) => updateMeal({ ...p, title: 'Lean Plan' }, 'm1', (m) => ({ ...m, photoId: mealPhoto })), d, '2026-10-12', 7);
    await ensureDayLog('2026-10-12', d, 8);
    await updateDayLog('2026-10-12', (l) => setItemAmount(markMealEaten(l, 'm1'), 'm2', 'm2-i1', 25.5), d);
    await ensureDayLog('2026-10-13', d, 9);
    await updateDayLog('2026-10-13', (l) => addExtraItem(l, 'm4', makeLoggedItem('e1', { name: 'Biscuit', kcal: 40.25 })), d);
    await updateDayLog('2026-10-13', (l) => addFreeSlotEntry(l, 'm3', { ...makeLoggedItem('f1', { name: 'Nuts', kcal: 120, fat: 9 }), photoId: entryPhoto }), d);

    const before = await snapshot(d);
    const file = JSON.stringify(await exportAll(d, 100));

    // wipe (and put something else there, to prove import replaces rather than merges)
    await Promise.all([d.settings.clear(), d.plan.clear(), d.dayLogs.clear(), d.photos.clear()]);
    await seedIfEmpty(d, 2);
    await ensureDayLog('2026-01-01', d, 3);

    const parsed = parseBackup(file, 1);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.summary).toEqual({ days: 2, photos: 2, from: '2026-10-12', to: '2026-10-13', exportedAt: 100 });
    await importAll(parsed.backup, d);

    expect(await snapshot(d)).toEqual(before);
  });

  it('import into another (empty) database works too', async () => {
    const a = fresh();
    await seedIfEmpty(a, 1);
    const b = fresh();
    const parsed = parseBackup(JSON.stringify(await exportAll(a)), 1);
    if (!parsed.ok) throw new Error(parsed.error);
    await importAll(parsed.backup, b);
    expect(await snapshot(b)).toEqual(await snapshot(a));
  });
});

describe('backup validation (SET-4)', () => {
  const good = async () => {
    const d = new PlateDB(`test-${crypto.randomUUID()}`);
    await seedIfEmpty(d, 1);
    const b = JSON.parse(JSON.stringify(await exportAll(d)));
    await d.delete();
    return b;
  };

  it('rejects non-backups, newer schema versions and damaged parts', async () => {
    expect(parseBackup('not json', 1)).toMatchObject({ ok: false, error: 'This file is not valid JSON.' });
    expect(validateBackup({ hello: 1 }, 1).ok).toBe(false);
    expect(validateBackup({ ...(await good()), schemaVersion: 2 }, 1)).toMatchObject({ ok: false, error: expect.stringContaining('newer version') });
    expect(validateBackup({ ...(await good()), plan: { id: 'active', title: 'x', meals: [{ id: 'm1' }] } }, 1).ok).toBe(false);
    expect(validateBackup({ ...(await good()), dayLogs: [{ date: '13/10/2026' }] }, 1).ok).toBe(false);
    expect(validateBackup({ ...(await good()), photos: [{ id: 'p', mimeType: 'image/jpeg', data: '%%%', thumbDataUrl: '' }] }, 1).ok).toBe(false);
    expect(validateBackup(await good(), 1).ok).toBe(true);
  });
});

describe('backup helpers', () => {
  it('base64 round-trips bytes', () => {
    const buf = new Uint8Array([0, 255, 128, 7]).buffer;
    expect(bytes(base64ToArrayBuffer(arrayBufferToBase64(buf)))).toEqual([0, 255, 128, 7]);
  });

  it('names the file with the local date', () => {
    expect(backupFileName(new Date(2026, 9, 3, 0, 30))).toBe('plate-backup-2026-10-03.json');
  });

  it('labels the last backup', () => {
    const now = 100 * DAY;
    expect(lastBackupLabel(undefined, now)).toBe('Never');
    expect(lastBackupLabel(now - 1000, now)).toBe('Today');
    expect(lastBackupLabel(now - DAY - 5, now)).toBe('Yesterday');
    expect(lastBackupLabel(now - 9 * DAY, now)).toBe('9 days ago');
  });

  it('shows the reminder after 7 days, honours a 24 h dismissal', () => {
    const now = 100 * DAY;
    expect(shouldShowBackupBanner({ seededAt: now - 3 * DAY }, now)).toBe(false); // new user, never backed up
    expect(shouldShowBackupBanner({ seededAt: now - 8 * DAY }, now)).toBe(true); // 8 days of use, never
    expect(shouldShowBackupBanner({ seededAt: 0, lastBackupAt: now - 2 * DAY }, now)).toBe(false);
    expect(shouldShowBackupBanner({ seededAt: 0, lastBackupAt: now - 8 * DAY }, now)).toBe(true);
    expect(shouldShowBackupBanner({ seededAt: 0, lastBackupAt: now - 8 * DAY, backupBannerDismissedAt: now - 3600_000 }, now)).toBe(false);
    expect(shouldShowBackupBanner({ seededAt: 0, lastBackupAt: now - 8 * DAY, backupBannerDismissedAt: now - 25 * 3600_000 }, now)).toBe(true);
  });
});
