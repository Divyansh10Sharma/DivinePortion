import { fmt, fmtAmount, sumItems } from '../../lib/nutrition';
import { macroText } from '../../lib/format';
import type { Meal } from '../../lib/types';
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

/** HOME-4: a regular meal card (read-only in Phase 1). */
export function MealCard({ meal }: { meal: Meal }) {
  const subtotal = sumItems(meal.items);
  const items = [...meal.items].sort((a, b) => a.order - b.order);

  return (
    <article className="rounded-[22px] bg-sage p-3.5 shadow-card">
      <header className="flex items-start gap-3">
        <MealPhoto size={60} />
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
        {items.map((item) => (
          <li key={item.id} className="flex items-baseline justify-between gap-3 text-[13px] leading-snug">
            <span className="min-w-0 text-espresso">
              {item.name}
              <span className="ml-1 text-[11px] whitespace-nowrap text-warm-grey tabular">
                {fmtAmount(item.amount)} {item.unit}
              </span>
              {item.note && <span className="ml-1 text-[11px] text-olive italic">— {item.note}</span>}
            </span>
            <span className="shrink-0 text-right text-[10.5px] whitespace-nowrap text-warm-grey tabular">
              {macroText(item)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-forest/15 pt-2 text-[12.5px] font-bold text-espresso">
        <span>Subtotal</span>
        <span className="text-right whitespace-nowrap tabular">{macroText(subtotal)}</span>
      </div>
    </article>
  );
}
