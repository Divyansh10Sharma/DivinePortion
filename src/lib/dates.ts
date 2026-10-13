// Local-date helpers (LOG-1, §11.6). The day boundary is LOCAL midnight.
// Never use toISOString() for day keys: at 04:45 IST it still returns the previous UTC day.

import { addDays, format, startOfDay } from 'date-fns';

/** "YYYY-MM-DD" in the device's local time zone — the DayLog primary key. */
export function localDateKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

/** Milliseconds from `now` until the next local midnight (used to roll the day over while the app stays open). */
export function msUntilNextLocalMidnight(now: Date = new Date()): number {
  return startOfDay(addDays(now, 1)).getTime() - now.getTime();
}

/** "HH:MM" → minutes since midnight. Malformed input sorts last. */
export function timeToMinutes(time: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return Number.POSITIVE_INFINITY;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}
