import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { entriesOf, extrasOf, freeSlotRemaining, mealEaten, mealLogOf } from '../../lib/dayLog';
import { fmt, fmtAmount, itemEatenValue, mealPlanned } from '../../lib/nutrition';
import { macroText } from '../../lib/format';
import type { DayLog, Item, ItemOverride, Meal } from '../../lib/types';
import type { LogActions } from '../../hooks/useLogActions';
import { DrawnCheck } from '../anim/DrawnCheck';
import { AnimatedNumber } from '../anim/AnimatedNumber';
import { MealPhoto } from '../cards/MealPhoto';
import { NumberInput } from '../inputs/NumberInput';
import { QuickItemForm } from '../inputs/QuickItemForm';
import { BottomSheet } from './BottomSheet';

const STATUS_LABEL = { none: 'Not eaten yet', partial: 'Partly eaten', eaten: 'Eaten' } as const;

/** Meal detail sheet (LOG-3 / LOG-4 / LOG-5). `meal` undefined = closed. */
export function MealSheet({
  meal,
  log,
  actions,
  onClose,
}: {
  meal: Meal | undefined;
  log: DayLog;
  actions: LogActions;
  onClose: () => void;
}) {
  return (
    <BottomSheet open={!!meal} onClose={onClose} label={meal?.name ?? 'Meal'} header={meal && <SheetHeader meal={meal} log={log} />}>
      {meal && (meal.isFreeSlot ? <FreeSlotBody meal={meal} log={log} actions={actions} /> : <MealBody meal={meal} log={log} actions={actions} />)}
    </BottomSheet>
  );
}

function SheetHeader({ meal, log }: { meal: Meal; log: DayLog }) {
  const status = mealLogOf(log, meal.id).status;
  return (
    <div className="flex items-center gap-3.5 px-4 pt-1 pb-3">
      <MealPhoto size={72} layoutId={`photo-${meal.id}`} eaten={status === 'eaten'} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-olive uppercase tabular">{meal.time}</p>
        <h2 className="font-serif text-[22px] leading-tight font-semibold text-espresso">{meal.name}</h2>
        <p className={`mt-0.5 text-[12.5px] font-medium ${status === 'eaten' ? 'text-forest' : 'text-warm-grey'}`}>
          {meal.isFreeSlot ? (status === 'eaten' ? 'Logged' : 'Nothing logged yet') : STATUS_LABEL[status]}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Regular meal
// ---------------------------------------------------------------------------

function MealBody({ meal, log, actions }: { meal: Meal; log: DayLog; actions: LogActions }) {
  const { status, itemOverrides } = mealLogOf(log, meal.id);
  const planned = mealPlanned(meal);
  const eaten = mealEaten(log, meal);
  const extras = extrasOf(log, meal.id);
  const items = [...meal.items].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      {/* Planned vs eaten for this meal */}
      <div className="flex items-center justify-between rounded-2xl bg-sage px-4 py-3">
        <div>
          <p className="text-[10.5px] font-semibold tracking-[0.14em] text-olive uppercase">Eaten</p>
          <p className="text-[20px] leading-tight font-bold text-forest">
            <AnimatedNumber value={eaten.kcal} /> <span className="text-[13px] font-semibold text-warm-grey">/ {fmt(planned.kcal)} kcal</span>
          </p>
          <p className="text-[12px] text-warm-grey tabular">
            {fmt(eaten.protein)}/{fmt(planned.protein)}g protein
          </p>
        </div>
        {status === 'eaten' ? (
          <button
            onClick={() => actions.markNotEaten(meal.id)}
            className="rounded-full border border-terracotta/50 px-3.5 py-2 text-[13px] font-semibold text-terracotta active:scale-[0.97]"
          >
            Mark as not eaten
          </button>
        ) : (
          <button
            onClick={() => actions.markEaten(meal.id)}
            className="flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-[13.5px] font-semibold text-cream active:scale-[0.97]"
          >
            <DrawnCheck size={14} /> Mark all eaten
          </button>
        )}
      </div>

      <ul className="divide-y divide-gold/25">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            override={itemOverrides[item.id]}
            onToggle={(v) => actions.setItemEaten(meal.id, item.id, v)}
            onAmount={(a) => actions.setItemAmount(meal.id, item.id, a)}
          />
        ))}
        {extras.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            extra
            override={itemOverrides[item.id]}
            onToggle={(v) => actions.setItemEaten(meal.id, item.id, v)}
            onAmount={(a) => actions.setItemAmount(meal.id, item.id, a)}
            onRemove={() => actions.removeExtra(meal.id, item.id)}
          />
        ))}
      </ul>

      <AddSection title="Add an extra item (today only)">
        <QuickItemForm withAmount submitLabel="Add to this meal" onSubmit={(v) => actions.addExtra(meal.id, v)} />
      </AddSection>
    </div>
  );
}

/** One item: tick to mark eaten (LOG-3), and the amount actually eaten (blank = as planned). */
function ItemRow({
  item,
  override,
  extra = false,
  onToggle,
  onAmount,
  onRemove,
}: {
  item: Item;
  override: ItemOverride | undefined;
  extra?: boolean;
  onToggle: (eaten: boolean) => void;
  onAmount: (amount: number | undefined) => void;
  onRemove?: () => void;
}) {
  const ticked = !!override?.eaten;
  const eatenValue = itemEatenValue(item, override);

  return (
    <li className="flex items-center gap-3 py-2.5">
      <button
        role="checkbox"
        aria-checked={ticked}
        aria-label={`${item.name} eaten`}
        onClick={() => onToggle(!ticked)}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
          ticked ? 'border-forest bg-forest text-cream' : 'border-warm-grey/50 bg-white text-transparent'
        }`}
      >
        {ticked && <DrawnCheck size={15} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-[14px] leading-snug text-espresso">
          {item.name}
          {extra && (
            <span className="ml-1.5 rounded-full bg-olive/12 px-1.5 py-px align-middle text-[9.5px] font-semibold tracking-wider text-olive uppercase">
              Today only
            </span>
          )}
        </p>
        <p className="text-[11px] text-warm-grey tabular">
          Plan {fmtAmount(item.amount)} {item.unit} · {fmt(item.kcal)} kcal
          {ticked && <span className="text-forest"> · ate {macroText(eatenValue)}</span>}
        </p>
      </div>

      <label className="flex shrink-0 items-center gap-1">
        <span className="sr-only">Amount eaten</span>
        <NumberInput
          value={override?.amount}
          placeholder={fmtAmount(item.amount)}
          onCommit={onAmount}
          className="w-[64px] text-right"
        />
        <span className="w-12 truncate text-[11px] text-warm-grey">{item.unit}</span>
      </label>

      {onRemove && (
        <button aria-label={`Remove ${item.name}`} onClick={onRemove} className="-mr-1 p-1 text-warm-grey active:text-terracotta">
          <X size={16} />
        </button>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Free slot (LOG-5)
// ---------------------------------------------------------------------------

function FreeSlotBody({ meal, log, actions }: { meal: Meal; log: DayLog; actions: LogActions }) {
  const entries = entriesOf(log, meal.id);
  const eaten = mealEaten(log, meal);
  const remaining = freeSlotRemaining(log, meal);
  const over = remaining < 0;

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl px-4 py-3 ${over ? 'bg-terracotta/10' : 'bg-sage'}`}>
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] text-warm-grey">
            Budget <span className="font-semibold text-espresso tabular">~{fmt(meal.freeSlotBudgetKcal ?? 0)} kcal</span>
          </p>
          <p className="text-[13px] text-warm-grey">
            Eaten <span className="font-semibold text-espresso"><AnimatedNumber value={eaten.kcal} /> kcal</span>
          </p>
        </div>
        <p className={`mt-1 text-[18px] font-bold ${over ? 'text-terracotta' : 'text-forest'}`}>
          <AnimatedNumber value={Math.abs(remaining)} /> kcal {over ? 'over budget' : 'remaining'}
        </p>
        {meal.freeSlotHint && <p className="mt-1 text-[12.5px] text-warm-grey italic">{meal.freeSlotHint}</p>}
      </div>

      {entries.length > 0 && (
        <ul className="divide-y divide-gold/25">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-espresso">{e.name}</p>
                <p className="text-[11px] text-warm-grey tabular">{macroText(e)}</p>
              </div>
              <button aria-label={`Remove ${e.name}`} onClick={() => actions.removeEntry(meal.id, e.id)} className="p-1 text-warm-grey active:text-terracotta">
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <AddSection title={entries.length ? 'Log something else' : 'Log what you ate'} initiallyOpen={entries.length === 0}>
        <QuickItemForm withAmount={false} submitLabel="Log it" onSubmit={(v) => actions.addEntry(meal.id, v)} />
      </AddSection>
    </div>
  );
}

function AddSection({ title, initiallyOpen = false, children }: { title: string; initiallyOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <div className="rounded-2xl border border-dashed border-olive/50 bg-white/50 p-3">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-[13.5px] font-semibold text-forest">
        <span className="flex items-center gap-1.5">
          <Plus size={16} aria-hidden /> {title}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown size={16} aria-hidden />
        </motion.span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
