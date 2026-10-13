import { useEffect, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { fmt, fmtAmount, sumItems } from '../../lib/nutrition';
import { macroText } from '../../lib/format';
import { extrasOf, mealLogOf } from '../../lib/dayLog';
import type { DayLog, Meal } from '../../lib/types';
import type { LogActions } from '../../hooks/useLogActions';
import { DrawnCheck } from '../anim/DrawnCheck';
import { MealPhoto } from './MealPhoto';

/** Dark-green pill, top-right of each card (HOME-4): "554 kcal / 40g Protein". */
function KcalBadge({ kcal, protein }: { kcal: number; protein: number }) {
  return (
    <span className="shrink-0 rounded-full bg-forest px-2.5 py-1 text-[11px] font-semibold leading-none whitespace-nowrap text-cream tabular">
      {fmt(kcal)} kcal / {fmt(protein)}g Protein
    </span>
  );
}

/** HOME-6: meal-level note badge, e.g. "LAST CAFFEINE OF THE DAY". */
function NoteBadge({ text }: { text: string }) {
  return (
    <span className="inline-block rounded-full border border-terracotta/40 bg-terracotta/10 px-2 py-0.5 text-[9.5px] font-semibold tracking-[0.12em] text-terracotta uppercase">
      {text}
    </span>
  );
}

/** Shared card chrome: tap anywhere (except buttons) opens the detail sheet; HOME-9 "next" glow; ANIM-3 settle. */
export function CardShell({
  className,
  isNext,
  settle,
  onOpen,
  label,
  children,
}: {
  className: string;
  isNext: boolean;
  /** Incremented when the meal becomes eaten → plays the soft scale "settle" once. */
  settle: number;
  onOpen: () => void;
  label: string;
  children: ReactNode;
}) {
  const [scope, animate] = useAnimate<HTMLElement>();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (settle === 0 || reduced || !scope.current) return;
    // ANIM-3: 1 → 0.98 → 1 with a spring; transform only (ANIM-12).
    void animate(scope.current, { scale: [1, 0.975, 1] }, { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] });
  }, [settle, reduced, animate, scope]);

  const open = (e: MouseEvent | KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    onOpen();
  };

  return (
    <article
      ref={scope}
      role="button"
      tabIndex={0}
      aria-label={`${label} — open details`}
      onClick={open}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open(e)}
      className={`${className} cursor-pointer transition-shadow duration-500 ${
        // HOME-9: the next meal gets a soft forest ring + glow.
        isNext ? 'ring-2 ring-forest/30 shadow-[0_0_0_6px_rgb(31_77_46/0.06),var(--shadow-card)]' : ''
      }`}
    >
      {children}
    </article>
  );
}

/** HOME-4 + logging (LOG-2, HOME-9). */
export function MealCard({
  meal,
  log,
  isNext,
  selected,
  settle,
  onOpen,
  actions,
}: {
  meal: Meal;
  log: DayLog;
  isNext: boolean;
  /** True while this meal's detail sheet is open — the photo has flown into the sheet. */
  selected: boolean;
  settle: number;
  onOpen: () => void;
  actions: LogActions;
}) {
  const { status, itemOverrides } = mealLogOf(log, meal.id);
  const subtotal = sumItems(meal.items);
  const items = [...meal.items].sort((a, b) => a.order - b.order);
  const extras = extrasOf(log, meal.id);
  const [confirmUndo, setConfirmUndo] = useState(false);

  return (
    <CardShell className="rounded-[22px] bg-sage p-3.5 shadow-card" isNext={isNext} settle={settle} onOpen={onOpen} label={meal.name}>
      <header className="flex items-start gap-3">
        {selected ? (
          <div style={{ width: 60, height: 60 }} className="shrink-0" />
        ) : (
          <MealPhoto size={60} layoutId={`photo-${meal.id}`} eaten={status === 'eaten'} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex justify-end">
            <KcalBadge kcal={subtotal.kcal} protein={subtotal.protein} />
          </div>
          <h3 className="mt-1.5 font-serif text-[17px] leading-snug font-semibold text-espresso">{meal.name}</h3>
          {meal.badge && (
            <div className="mt-1">
              <NoteBadge text={meal.badge} />
            </div>
          )}
          {meal.note && <p className="mt-1 text-[12px] text-warm-grey italic">{meal.note}</p>}
        </div>
      </header>

      <ul className="mt-3 space-y-1.5 border-t border-gold/35 pt-2.5">
        {items.map((item) => {
          const o = itemOverrides[item.id];
          return (
            <li key={item.id} className="flex items-baseline justify-between gap-3 text-[13px] leading-snug">
              <span className="min-w-0 text-espresso">
                {o?.eaten && <Check size={12} strokeWidth={3} className="mr-1 inline align-[-1px] text-forest" aria-label="eaten" />}
                {item.name}
                <span className="ml-1 text-[11px] whitespace-nowrap text-warm-grey tabular">
                  {fmtAmount(item.amount)} {item.unit}
                </span>
                {o?.eaten && o.amount !== undefined && o.amount !== item.amount && (
                  <span className="ml-1 text-[11px] whitespace-nowrap text-forest tabular">· ate {fmtAmount(o.amount)}</span>
                )}
                {item.note && <span className="ml-1 text-[11px] text-olive italic">— {item.note}</span>}
              </span>
              <span className="shrink-0 text-right text-[10.5px] whitespace-nowrap text-warm-grey tabular">{macroText(item)}</span>
            </li>
          );
        })}
        {/* LOG-4: today-only extras */}
        {extras.map((item) => (
          <li key={item.id} className="flex items-baseline justify-between gap-3 text-[13px] leading-snug">
            <span className="min-w-0 text-olive">
              + {item.name}
              <span className="ml-1 text-[11px] whitespace-nowrap text-warm-grey tabular">
                {fmtAmount(item.amount)} {item.unit} · today
              </span>
            </span>
            <span className="shrink-0 text-right text-[10.5px] whitespace-nowrap text-warm-grey tabular">{macroText(item)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-forest/15 pt-2 text-[12.5px] font-bold text-espresso">
        <span>Subtotal</span>
        <span className="text-right whitespace-nowrap tabular">{macroText(subtotal)}</span>
      </div>

      {/* LOG-2: Eaten button; tapping again offers "Mark as not eaten". */}
      <div className="mt-3 flex min-h-9 items-center justify-end gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {confirmUndo ? (
            <motion.div key="confirm" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button onClick={() => setConfirmUndo(false)} className="rounded-full px-3 py-1.5 text-[12.5px] font-medium text-warm-grey">
                Keep
              </button>
              <button
                onClick={() => {
                  actions.markNotEaten(meal.id);
                  setConfirmUndo(false);
                }}
                className="rounded-full border border-terracotta/50 bg-porcelain px-3 py-1.5 text-[12.5px] font-semibold text-terracotta"
              >
                Mark as not eaten
              </button>
            </motion.div>
          ) : status === 'eaten' ? (
            <motion.button
              key="eaten"
              onClick={() => setConfirmUndo(true)}
              className="flex items-center gap-1.5 rounded-full bg-forest/10 px-3.5 py-1.5 text-[13px] font-semibold text-forest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DrawnCheck size={15} /> Eaten
            </motion.button>
          ) : (
            <motion.div key="open" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {status === 'partial' && <span className="text-[12px] font-medium text-olive">Partly eaten</span>}
              <button
                onClick={() => actions.markEaten(meal.id)}
                className="rounded-full bg-forest px-4 py-1.5 text-[13px] font-semibold text-cream shadow-sm active:scale-[0.97]"
              >
                {status === 'partial' ? 'Finish meal' : 'Mark eaten'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CardShell>
  );
}
