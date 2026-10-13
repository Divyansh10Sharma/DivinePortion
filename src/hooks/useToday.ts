import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { ensureDayLog } from '../db/dayLogs';
import { localDateKey, msUntilNextLocalMidnight } from '../lib/dates';
import type { DayLog } from '../lib/types';

/**
 * A clock that ticks every minute, at local midnight, and whenever the app returns to the
 * foreground. LOG-1: an installed PWA can stay open (or suspended) across midnight, so the date
 * is re-checked on `visibilitychange` — iOS freezes timers while the app is in the background.
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const interval = window.setInterval(tick, 60_000);
    let midnight = window.setTimeout(function rollover() {
      tick();
      midnight = window.setTimeout(rollover, msUntilNextLocalMidnight() + 50);
    }, msUntilNextLocalMidnight() + 50);
    const onVisible = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(midnight);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return now;
}

/** Today's DayLog (created on first open of the day) plus the live clock. */
export function useToday(ready: boolean): { date: string; now: Date; log: DayLog | undefined } {
  const now = useNow();
  const date = localDateKey(now);

  useEffect(() => {
    if (ready) void ensureDayLog(date);
  }, [ready, date]);

  const log = useLiveQuery(() => (ready ? db.dayLogs.get(date) : undefined), [ready, date]);
  return { date, now, log };
}
