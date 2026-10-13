import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dayTotals, finalDayStatus, targetStatus, type DayStatus } from '../lib/dayLog';
import { localDateKey } from '../lib/dates';
import { fmt } from '../lib/nutrition';
import type { DayLog } from '../lib/types';
import type { LogActions } from '../hooks/useLogActions';
import { Timeline } from '../components/timeline/Timeline';
import { TargetsPanel } from '../components/rings/TargetsPanel';
import { DayTotalsBar } from '../components/poster/DayTotalsBar';

const DOT: Record<DayStatus | 'today', string> = {
  good: 'bg-forest',
  warning: 'bg-terracotta',
  empty: 'bg-warm-grey/45',
  today: 'bg-olive',
};
const DOT_LABEL: Record<DayStatus | 'today', string> = {
  good: 'targets met',
  warning: 'over calories or a minimum missed',
  empty: 'nothing logged as eaten',
  today: 'today, in progress',
};

const WEEK_STARTS_ON = 1; // Monday

const parseKey = (key: string) => new Date(`${key}T12:00:00`); // noon: safe from DST edges

/** History tab (HIST-1, HIST-2). Days are immutable snapshots (HIST-3), so this is all read-only. */
export function HistoryScreen({ logs, today }: { logs: DayLog[]; today: string }) {
  const [month, setMonth] = useState(() => startOfMonth(parseKey(today)));
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => new Map(logs.map((l) => [l.date, l])), [logs]);
  const statusOf = (log: DayLog): DayStatus | 'today' => (log.date === today ? 'today' : finalDayStatus(log));
  const past = useMemo(() => [...logs].sort((a, b) => b.date.localeCompare(a.date)), [logs]);
  const selectedLog = selected ? byDate.get(selected) : undefined;

  const days = eachDayOfInterval({
    start: startOfWeek(month, { weekStartsOn: WEEK_STARTS_ON }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: WEEK_STARTS_ON }),
  });
  const firstLogged = past.at(-1)?.date;

  return (
    <div className="mx-auto max-w-[480px] px-4 pt-6">
      <AnimatePresence mode="wait" initial={false}>
        {selectedLog ? (
          <motion.div key={selectedLog.date} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}>
            <DayView log={selectedLog} isToday={selectedLog.date === today} onBack={() => setSelected(null)} />
          </motion.div>
        ) : (
          <motion.div key="overview" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
            <h1 className="font-serif text-[28px] font-bold text-forest">History</h1>

            {/* Month grid */}
            <section className="mt-4 rounded-[22px] bg-porcelain p-3.5 shadow-card" aria-label="Calendar">
              <div className="mb-2 flex items-center justify-between">
                <button
                  aria-label="Previous month"
                  onClick={() => setMonth((m) => addMonths(m, -1))}
                  disabled={!!firstLogged && format(month, 'yyyy-MM') <= firstLogged.slice(0, 7)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-forest disabled:opacity-25"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="font-serif text-[18px] font-semibold text-espresso">{format(month, 'MMMM yyyy')}</h2>
                <button
                  aria-label="Next month"
                  onClick={() => setMonth((m) => addMonths(m, 1))}
                  disabled={format(month, 'yyyy-MM') >= today.slice(0, 7)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-forest disabled:opacity-25"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="grid grid-cols-7 text-center text-[10.5px] font-semibold tracking-wider text-warm-grey uppercase">
                {days.slice(0, 7).map((d) => (
                  <span key={d.toISOString()} className="pb-1.5">
                    {format(d, 'EEEEE')}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {days.map((d) => {
                  const key = localDateKey(d);
                  const log = byDate.get(key);
                  const inMonth = isSameMonth(d, month);
                  const isToday = key === today;
                  const st = log ? statusOf(log) : undefined;
                  return (
                    <button
                      key={key}
                      disabled={!log}
                      onClick={() => setSelected(key)}
                      aria-label={`${format(d, 'EEEE d MMMM')}${st ? `: ${DOT_LABEL[st]}` : ': no log'}`}
                      className={`mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-full text-[14px] tabular ${
                        isToday ? 'ring-[1.5px] ring-forest/60' : ''
                      } ${log ? 'font-semibold text-espresso active:bg-sage' : 'text-warm-grey/50'} ${inMonth ? '' : 'opacity-35'}`}
                    >
                      {format(d, 'd')}
                      <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${st ? DOT[st] : 'bg-transparent'}`} aria-hidden />
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 border-t border-gold/30 pt-2.5 text-[11px] text-warm-grey">
                {(['good', 'warning', 'empty', 'today'] as const).map((k) => (
                  <span key={k} className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${DOT[k]}`} /> {DOT_LABEL[k]}
                  </span>
                ))}
              </div>
            </section>

            {/* List of days */}
            <h2 className="mt-6 mb-2 font-serif text-[19px] font-semibold text-forest">Logged days</h2>
            {past.length === 0 ? (
              <p className="text-[14px] text-warm-grey">Nothing here yet — days appear once the app has been opened on them.</p>
            ) : (
              <ul className="space-y-2">
                {past.map((log) => {
                  const t = dayTotals(log);
                  const st = statusOf(log);
                  return (
                    <li key={log.date}>
                      <button
                        onClick={() => setSelected(log.date)}
                        className="flex w-full items-center gap-3 rounded-[18px] bg-sage px-4 py-3 text-left shadow-card"
                      >
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[st]}`} aria-label={DOT_LABEL[st]} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-serif text-[16px] font-semibold text-espresso">
                            {log.date === today ? 'Today' : format(parseKey(log.date), 'EEEE d MMM')}
                          </span>
                          <span className="block text-[12px] text-warm-grey tabular">
                            {fmt(t.eaten.kcal)} / {fmt(log.targetsSnapshot.kcal)} kcal · {fmt(t.eaten.protein)}g P · {fmt(t.eaten.fat)}g F ·{' '}
                            {fmt(t.eaten.fibre)}g fibre
                          </span>
                        </span>
                        <ChevronRight size={18} className="shrink-0 text-warm-grey" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const noop = () => {};
/** History is read-only: the timeline gets actions that do nothing (its buttons are hidden anyway). */
const NO_ACTIONS: LogActions = {
  markEaten: noop,
  markNotEaten: noop,
  setItemEaten: noop,
  setItemAmount: noop,
  addExtra: noop,
  removeExtra: noop,
  addEntry: noop,
  removeEntry: noop,
  restoreExtra: noop,
  restoreEntry: noop,
};

/** HIST-2: read-only poster of a logged day — eaten state, extras, free-slot entries, planned vs eaten, targets. */
function DayView({ log, isToday, onBack }: { log: DayLog; isToday: boolean; onBack: () => void }) {
  const totals = dayTotals(log);
  // Past days are judged on what was finally eaten; today still projects (§4.4).
  const status = targetStatus(log, { final: !isToday });

  return (
    <div>
      <button onClick={onBack} className="-ml-1 flex items-center gap-0.5 text-[14px] font-semibold text-forest">
        <ChevronLeft size={18} aria-hidden /> History
      </button>
      <h1 className="mt-2 font-serif text-[26px] leading-tight font-bold text-forest">{format(parseKey(log.date), 'EEEE d MMMM yyyy')}</h1>
      <p className="mt-0.5 text-[12.5px] text-warm-grey tabular">
        Targets that day: {fmt(log.targetsSnapshot.kcal)} kcal · ≥{fmt(log.targetsSnapshot.proteinMin)}g protein · ≥
        {fmt(log.targetsSnapshot.fatMin)}g fat · ≥{fmt(log.targetsSnapshot.fibreMin)}g fibre
        {isToday && ' · still in progress'}
      </p>

      <div className="mt-4 mb-6">
        <TargetsPanel totals={totals} status={status} final={!isToday} />
      </div>
      <Timeline log={log} readOnly nextId={undefined} selectedId={null} onOpen={() => {}} actions={NO_ACTIONS} />
      <div className="mt-6">
        <DayTotalsBar meals={totals.plannedMeals} withSnackKcal={totals.plannedWithSnack.kcal} />
      </div>
    </div>
  );
}
