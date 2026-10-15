import { useCallback, useState } from 'react';
import { format } from 'date-fns';
import { BookmarkPlus, ChevronRight } from 'lucide-react';
import { fmt, plannedMeals, plannedWithSnack } from '../lib/nutrition';
import { byOrder } from '../lib/planEdit';
import type { Plan, SavedPlan } from '../lib/types';
import { saveCurrentPlan, applySavedPlan } from '../db/library';
import { showToast } from '../components/toast/toastStore';
import { PromptDialog } from '../components/dialog/PromptDialog';
import { ConfirmDialog } from '../components/dialog/ConfirmDialog';
import { BottomSheet } from '../components/sheets/BottomSheet';
import { DayTotalsBar } from '../components/poster/DayTotalsBar';
import { MealCard } from '../components/cards/MealCard';
import { FreeSlotCard } from '../components/cards/FreeSlotCard';

/**
 * Saved plans (v2 redesign): named copies of the meals. Tap a card to see the plan in a sheet;
 * "Use this plan" makes it the current meals. (No rename / delete — owner choice.)
 */
export function PlansScreen({ plan, saved }: { plan: Plan; saved: SavedPlan[] }) {
  const [naming, setNaming] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmUse, setConfirmUse] = useState(false);
  const close = useCallback(() => setOpenId(null), []);

  const plans = [...saved].sort((a, b) => b.createdAt - a.createdAt);
  const open = plans.find((p) => p.id === openId);

  return (
    <div className="mx-auto max-w-[480px] px-4 pt-6">
      <h1 className="font-serif text-[28px] font-bold text-forest">Saved plans</h1>
      <p className="text-[12.5px] text-warm-grey">Keep copies of your meals and switch between them.</p>

      <button
        onClick={() => setNaming(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[20px] bg-forest py-3 text-[14.5px] font-semibold text-cream active:scale-[0.98]"
      >
        <BookmarkPlus size={18} aria-hidden /> Save current meals as a plan
      </button>

      {plans.length === 0 ? (
        <p className="mt-6 rounded-[22px] bg-porcelain p-5 text-center text-[14px] leading-relaxed text-warm-grey shadow-card">
          No saved plans yet. Save your current meals above to keep a copy you can come back to.
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
          {plans.map((p) => {
            const t = plannedWithSnack(p.meals);
            return (
              <li key={p.id}>
                <button
                  onClick={() => setOpenId(p.id)}
                  className="flex h-full w-full flex-col rounded-[22px] bg-sage p-4 text-left shadow-card active:scale-[0.98]"
                >
                  <span className="flex w-full items-start justify-between gap-2">
                    <span className="min-w-0 font-serif text-[18px] leading-snug font-semibold text-espresso">{p.name}</span>
                    <ChevronRight size={18} className="mt-1 shrink-0 text-warm-grey" aria-hidden />
                  </span>
                  <span className="mt-2 inline-block w-fit rounded-full bg-forest px-2.5 py-1 text-[11px] leading-none font-semibold text-cream tabular">
                    {fmt(t.kcal)} kcal / {fmt(t.protein)}g Protein
                  </span>
                  <span className="mt-2 text-[12px] text-warm-grey">
                    {p.meals.length} meal{p.meals.length === 1 ? '' : 's'} · saved {format(new Date(p.createdAt), 'd MMM yyyy')}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <PromptDialog
        open={naming}
        title="Name this plan"
        message={`Saves a copy of your current ${plan.meals.length} meals.`}
        placeholder="e.g. Bulking — October"
        initialValue={plan.title}
        confirmLabel="Save"
        onCancel={() => setNaming(false)}
        onConfirm={(name) => {
          setNaming(false);
          void saveCurrentPlan(name).then(() => showToast({ message: `Saved “${name}”` }));
        }}
      />

      <BottomSheet
        open={!!open}
        onClose={close}
        label={open ? open.name : 'Saved plan'}
        header={
          open && (
            <div className="px-4 pb-2">
              <h2 className="font-serif text-[22px] leading-tight font-semibold text-espresso">{open.name}</h2>
              <p className="text-[12.5px] text-warm-grey">Saved {format(new Date(open.createdAt), 'd MMM yyyy, HH:mm')}</p>
            </div>
          )
        }
      >
        {open && (
          <div className="space-y-4 pt-1">
            <DayTotalsBar meals={plannedMeals(open.meals)} withSnackKcal={plannedWithSnack(open.meals).kcal} />
            <ul className="space-y-3">
              {byOrder(open.meals).map((m) => (
                <li key={m.id}>
                  <p className="mb-1 pl-1 text-[11px] font-semibold text-olive tabular">{m.time}</p>
                  {m.isFreeSlot ? <FreeSlotCard meal={m} /> : <MealCard meal={m} />}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setConfirmUse(true)}
              className="w-full rounded-full bg-forest py-3 text-[15px] font-semibold text-cream active:scale-[0.98]"
            >
              Use this plan
            </button>
          </div>
        )}
      </BottomSheet>

      <ConfirmDialog
        open={confirmUse && !!open}
        title={`Use “${open?.name ?? ''}”?`}
        message="Your current meals will be replaced by this plan. Save them as a plan first if you want to keep them."
        confirmLabel="Use plan"
        cancelLabel="Cancel"
        onCancel={() => setConfirmUse(false)}
        onConfirm={() => {
          const target = open;
          setConfirmUse(false);
          close();
          if (target) void applySavedPlan(target.id).then(() => showToast({ message: `Now using “${target.name}”` }));
        }}
      />
    </div>
  );
}
