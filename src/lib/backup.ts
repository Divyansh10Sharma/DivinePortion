// Backup file format + validation (SET-3, SET-4). Pure functions; the DB side lives in db/backup.ts.
//
// One JSON file holds everything: settings, the plan, every day log and every photo, with photo
// bytes embedded as base64 (§11.11). `schemaVersion` lets future versions migrate or refuse.

import { format } from 'date-fns';
import type { DayLog, LibraryItem, Photo, Plan, SavedPlan, Settings } from './types';

export const BACKUP_APP = 'plate';

export interface BackupPhoto extends Omit<Photo, 'data'> {
  /** base64 of the stored bytes */
  data: string;
}

export interface BackupFile {
  app: typeof BACKUP_APP;
  schemaVersion: number;
  exportedAt: number;
  settings: Settings;
  plan: Plan;
  /** Legacy daily logs (v1 data), kept so nothing is lost. */
  dayLogs: DayLog[];
  photos: BackupPhoto[];
  /** v2: "Your items". Missing in v1 backups. */
  library?: LibraryItem[];
  /** v2: saved plans. Missing in v1 backups. */
  savedPlans?: SavedPlan[];
}

export interface BackupSummary {
  meals: number;
  items: number;
  savedPlans: number;
  days: number;
  photos: number;
  /** first / last logged date ("YYYY-MM-DD"), undefined when there are no day logs */
  from?: string;
  to?: string;
  exportedAt: number;
}

export function backupFileName(date: Date = new Date()): string {
  return `plate-backup-${format(date, 'yyyy-MM-dd')}.json`;
}

// ---------------------------------------------------------------------------
// base64 <-> ArrayBuffer (chunked so large photos don't blow the call stack)
// ---------------------------------------------------------------------------

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

export function buildBackup(
  data: { settings: Settings; plan: Plan; dayLogs: DayLog[]; photos: Photo[]; library: LibraryItem[]; savedPlans: SavedPlan[] },
  schemaVersion: number,
  now = Date.now(),
): BackupFile {
  return {
    app: BACKUP_APP,
    schemaVersion,
    exportedAt: now,
    settings: data.settings,
    plan: data.plan,
    dayLogs: [...data.dayLogs].sort((a, b) => a.date.localeCompare(b.date)),
    photos: data.photos.map((p) => ({ ...p, data: arrayBufferToBase64(p.data) })),
    library: [...data.library].sort((a, b) => a.name.localeCompare(b.name)),
    savedPlans: [...data.savedPlans].sort((a, b) => a.createdAt - b.createdAt),
  };
}

export function summarize(b: BackupFile): BackupSummary {
  const dates = b.dayLogs.map((l) => l.date).sort();
  return {
    meals: b.plan.meals.length,
    items: b.library?.length ?? 0,
    savedPlans: b.savedPlans?.length ?? 0,
    days: dates.length,
    photos: b.photos.length,
    from: dates[0],
    to: dates.at(-1),
    exportedAt: b.exportedAt,
  };
}

/** Back to stored shapes (photo bytes as ArrayBuffer). */
export function photosFromBackup(b: BackupFile): Photo[] {
  return b.photos.map((p) => ({ ...p, data: base64ToArrayBuffer(p.data) }));
}

// ---------------------------------------------------------------------------
// Validate (SET-4)
// ---------------------------------------------------------------------------

export type ValidationResult = { ok: true; backup: BackupFile; summary: BackupSummary } | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const NUTRIENTS = ['kcal', 'protein', 'carbs', 'fat', 'fibre'] as const;

function validItem(v: unknown): boolean {
  return isObj(v) && isStr(v.id) && isStr(v.name) && isNum(v.amount) && isStr(v.unit) && NUTRIENTS.every((k) => isNum(v[k]));
}

function validMeals(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.every(
      (m) => isObj(m) && isStr(m.id) && isStr(m.name) && isStr(m.time) && typeof m.isFreeSlot === 'boolean' && Array.isArray(m.items) && m.items.every(validItem),
    )
  );
}

function validItemMap(v: unknown): boolean {
  return isObj(v) && Object.values(v).every((list) => Array.isArray(list) && list.every(validItem));
}

/** Checks structure and schemaVersion. Never throws. */
export function validateBackup(raw: unknown, currentSchemaVersion: number): ValidationResult {
  if (!isObj(raw)) return { ok: false, error: 'This file is not a Plate backup.' };
  if (raw.app !== BACKUP_APP) return { ok: false, error: 'This file is not a Plate backup.' };
  if (!isNum(raw.schemaVersion) || raw.schemaVersion < 1) return { ok: false, error: 'The backup has no valid schema version.' };
  if (raw.schemaVersion > currentSchemaVersion) {
    return { ok: false, error: 'This backup was made by a newer version of Plate. Update the app first.' };
  }
  if (!isNum(raw.exportedAt)) return { ok: false, error: 'The backup is missing its export date.' };

  const s = raw.settings;
  if (!isObj(s) || s.id !== 'settings' || !isObj(s.targets) || !['kcal', 'proteinMin', 'fatMin', 'fibreMin'].every((k) => isNum((s.targets as Record<string, unknown>)[k])) || !Array.isArray(s.footerItems)) {
    return { ok: false, error: 'The backup settings are damaged.' };
  }
  const p = raw.plan;
  if (!isObj(p) || p.id !== 'active' || !isStr(p.title) || !validMeals(p.meals)) return { ok: false, error: 'The backup plan is damaged.' };

  if (!Array.isArray(raw.dayLogs)) return { ok: false, error: 'The backup day logs are damaged.' };
  for (const l of raw.dayLogs) {
    if (!isObj(l) || !isStr(l.date) || !DATE_RE.test(l.date) || !validMeals(l.mealsSnapshot) || !isObj(l.eaten) || !validItemMap(l.extraItems) || !validItemMap(l.freeSlotEntries) || !isObj(l.targetsSnapshot)) {
      return { ok: false, error: `The day log ${isObj(l) && isStr(l.date) ? l.date : ''} is damaged.`.replace('  ', ' ') };
    }
  }
  const dates = new Set((raw.dayLogs as { date: string }[]).map((l) => l.date));
  if (dates.size !== raw.dayLogs.length) return { ok: false, error: 'The backup has the same day twice.' };

  if (!Array.isArray(raw.photos)) return { ok: false, error: 'The backup photos are damaged.' };
  for (const ph of raw.photos) {
    if (!isObj(ph) || !isStr(ph.id) || !isStr(ph.mimeType) || !isStr(ph.data) || !isStr(ph.thumbDataUrl)) {
      return { ok: false, error: 'A photo in the backup is damaged.' };
    }
    try {
      atob(ph.data);
    } catch {
      return { ok: false, error: 'A photo in the backup is damaged.' };
    }
  }

  if (raw.library !== undefined) {
    if (!Array.isArray(raw.library)) return { ok: false, error: 'The backup items are damaged.' };
    for (const l of raw.library) {
      if (!isObj(l) || !isStr(l.id) || !isStr(l.name) || !isObj(l.per100) || !NUTRIENTS.every((k) => isNum((l.per100 as Record<string, unknown>)[k]))) {
        return { ok: false, error: 'An item in the backup is damaged.' };
      }
    }
  }
  if (raw.savedPlans !== undefined) {
    if (!Array.isArray(raw.savedPlans)) return { ok: false, error: 'The backup saved plans are damaged.' };
    for (const sp of raw.savedPlans) {
      if (!isObj(sp) || !isStr(sp.id) || !isStr(sp.name) || !validMeals(sp.meals)) return { ok: false, error: 'A saved plan in the backup is damaged.' };
    }
  }

  const backup = raw as unknown as BackupFile;
  return { ok: true, backup, summary: summarize(backup) };
}

/** Parses JSON text then validates. */
export function parseBackup(text: string, currentSchemaVersion: number): ValidationResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' };
  }
  return validateBackup(raw, currentSchemaVersion);
}

// ---------------------------------------------------------------------------
// Reminder (SET-5)
// ---------------------------------------------------------------------------

const DAY = 24 * 60 * 60 * 1000;

/** "Last backup: today / yesterday / X days ago / Never". */
export function lastBackupLabel(lastBackupAt: number | undefined, now = Date.now()): string {
  if (!lastBackupAt) return 'Never';
  const days = Math.floor((now - lastBackupAt) / DAY);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

/**
 * Show the Today banner when the last backup is more than 7 days old — or, if there has never been
 * one, once the app has been in use for more than 7 days — unless dismissed in the last 24 h.
 */
export function shouldShowBackupBanner(settings: Pick<Settings, 'lastBackupAt' | 'backupBannerDismissedAt' | 'seededAt'>, now = Date.now()): boolean {
  const since = settings.lastBackupAt ?? settings.seededAt;
  if (now - since <= 7 * DAY) return false;
  if (settings.backupBannerDismissedAt && now - settings.backupBannerDismissedAt < DAY) return false;
  return true;
}
