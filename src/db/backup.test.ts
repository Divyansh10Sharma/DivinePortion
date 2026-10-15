import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { updateMeal } from '../lib/planEdit';
import { itemFromLibrary } from '../lib/library';
import { plannedMeals } from '../lib/nutrition';
import {
  arrayBufferToBase64,
  backupFileName,
  base64ToArrayBuffer,
  lastBackupLabel,
  parseBackup,
  shouldShowBackupBanner,
  validateBackup,
} from '../lib/backup';
import type { DayLog } from '../lib/types';
import { exportAll, importAll } from './backup';
import { PlateDB, seedIfEmpty } from './db';
import { addLibraryItem, saveCurrentPlan } from './library';
import { savePhoto } from './photos';
import { buildSeedPlan, buildSeedSettings, SCHEMA_VERSION } from './seed';
import { updatePlan } from './plan';

const DAY = 86_400_000;
const bytes = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf));

async function snapshot(d: PlateDB) {
  const [settings, plan, dayLogs, photos, library, savedPlans] = await Promise.all([
    d.settings.toArray(),
    d.plan.toArray(),
    d.dayLogs.toArray(),
    d.photos.toArray(),
    d.library.toArray(),
    d.savedPlans.toArray(),
  ]);
  // ArrayBuffers → byte arrays so deep-equal compares contents.
  const byId = <T extends { id: string }>(xs: T[]) => [...xs].sort((a, b) => a.id.localeCompare(b.id));
  return { settings, plan, dayLogs, photos: byId(photos).map((p) => ({ ...p, data: bytes(p.data) })), library: byId(library), savedPlans: byId(savedPlans) };
}

const legacyLog = (date: string, plan: { meals: DayLog['mealsSnapshot'] }): DayLog => ({
  date,
  mealsSnapshot: plan.meals,
  eaten: { m1: { status: 'eaten', itemOverrides: { 'm1-i1': { eaten: true } } } },
  extraItems: {},
  freeSlotEntries: {},
  targetsSnapshot: { kcal: 2363, proteinMin: 140, fatMin: 45, fibreMin: 45 },
  createdAt: 1,
  updatedAt: 2,
});

describe('backup round-trip', () => {
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

  it('export → wipe → import gives back exactly the same data: meals, Your items, saved plans, legacy days, photos', async () => {
    const d = fresh();
    await seedIfEmpty(d, 1);
    const big = new Uint8Array(200_000).map((_, i) => (i * 7) % 256); // exercises chunked base64
    const mealPhoto = await savePhoto({ data: big.buffer, mimeType: 'image/jpeg', width: 1000, height: 750, thumbDataUrl: 'data:image/jpeg;base64,AAAA' }, d, 5);
    const oldPhoto = await savePhoto({ data: new Uint8Array([1, 2, 3]).buffer, mimeType: 'image/png', width: 3, height: 1, thumbDataUrl: 'data:,' }, d, 6);
    const curd = await addLibraryItem({ name: 'Curd', per100: { kcal: 60, protein: 3.5, carbs: 4.5, fat: 3, fibre: 0 } }, d, 7);
    await updatePlan((p) => updateMeal({ ...p, title: 'Lean Plan' }, 'm1', (m) => ({ ...m, photoId: oldPhoto })), d, 8);
    await saveCurrentPlan('Old photo plan', d, 9);
    await updatePlan(
      (p) => updateMeal(p, 'm1', (m) => ({ ...m, photoId: mealPhoto, items: [...m.items, itemFromLibrary(curd, 'm1-curd', 9, 150.5)] })),
      d,
      10,
    );
    await d.dayLogs.put(legacyLog('2026-10-12', (await d.plan.get('active'))!));

    const before = await snapshot(d);
    const file = JSON.stringify(await exportAll(d, 100));

    // wipe (and put something else there, to prove import replaces rather than merges)
    await Promise.all([d.settings.clear(), d.plan.clear(), d.dayLogs.clear(), d.photos.clear(), d.library.clear(), d.savedPlans.clear()]);
    await seedIfEmpty(d, 2);

    const parsed = parseBackup(file, SCHEMA_VERSION);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.summary).toEqual({ meals: 8, items: 9, savedPlans: 1, days: 1, photos: 2, from: '2026-10-12', to: '2026-10-12', exportedAt: 100 });
    await importAll(parsed.backup, d);

    expect(await snapshot(d)).toEqual(before);
  });

  it('import into another (empty) database works too', async () => {
    const a = fresh();
    await seedIfEmpty(a, 1);
    const b = fresh();
    const parsed = parseBackup(JSON.stringify(await exportAll(a)), SCHEMA_VERSION);
    if (!parsed.ok) throw new Error(parsed.error);
    await importAll(parsed.backup, b);
    expect(await snapshot(b)).toEqual(await snapshot(a));
  });

  it('an old v1 backup imports and gets its items converted into Your items', async () => {
    const d = fresh();
    const v1 = {
      app: 'plate',
      schemaVersion: 1,
      exportedAt: 50,
      settings: buildSeedSettings(1),
      plan: buildSeedPlan(1),
      dayLogs: [legacyLog('2026-10-01', buildSeedPlan(1))],
      photos: [],
    };
    const parsed = parseBackup(JSON.stringify(v1), SCHEMA_VERSION);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.summary).toMatchObject({ meals: 8, items: 0, savedPlans: 0, days: 1 });
    await importAll(parsed.backup, d);
    expect(await d.library.count()).toBe(8);
    const plan = (await d.plan.get('active'))!;
    expect(plannedMeals(plan.meals).kcal).toBe(2233);
    expect((await d.settings.get('settings'))!.schemaVersion).toBe(SCHEMA_VERSION);
    expect(await d.dayLogs.count()).toBe(1);
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
    expect(parseBackup('not json', SCHEMA_VERSION)).toMatchObject({ ok: false, error: 'This file is not valid JSON.' });
    expect(validateBackup({ hello: 1 }, SCHEMA_VERSION).ok).toBe(false);
    expect(validateBackup({ ...(await good()), schemaVersion: SCHEMA_VERSION + 1 }, SCHEMA_VERSION)).toMatchObject({ ok: false, error: expect.stringContaining('newer version') });
    expect(validateBackup({ ...(await good()), plan: { id: 'active', title: 'x', meals: [{ id: 'm1' }] } }, SCHEMA_VERSION).ok).toBe(false);
    expect(validateBackup({ ...(await good()), dayLogs: [{ date: '13/10/2026' }] }, SCHEMA_VERSION).ok).toBe(false);
    expect(validateBackup({ ...(await good()), photos: [{ id: 'p', mimeType: 'image/jpeg', data: '%%%', thumbDataUrl: '' }] }, SCHEMA_VERSION).ok).toBe(false);
    expect(validateBackup({ ...(await good()), library: [{ id: 'l', name: 'x', per100: { kcal: 'a' } }] }, SCHEMA_VERSION).ok).toBe(false);
    expect(validateBackup({ ...(await good()), savedPlans: [{ id: 's', name: 'x', meals: 'nope' }] }, SCHEMA_VERSION).ok).toBe(false);
    expect(validateBackup(await good(), SCHEMA_VERSION).ok).toBe(true);
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
