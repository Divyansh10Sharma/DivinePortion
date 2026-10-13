import { Check } from 'lucide-react';
import type { DayTotals, MinTarget, TargetStatus } from '../../lib/dayLog';
import { fmt, NUTRIENT_KEYS, type NutrientKey } from '../../lib/nutrition';
import { AnimatedNumber } from '../anim/AnimatedNumber';
import { ProgressRing } from './ProgressRing';

const COLOR = { forest: 'var(--forest)', olive: 'var(--olive)', terracotta: 'var(--terracotta)' };

/** §4.4 colours: met → forest + check; projected short → terracotta; otherwise olive (on track). */
function minColor(t: MinTarget): string {
  return t.status === 'met' ? COLOR.forest : t.status === 'warning' ? COLOR.terracotta : COLOR.olive;
}

function Ring({
  label,
  eaten,
  goal,
  goalText,
  color,
  met,
}: {
  label: string;
  eaten: number;
  goal: number;
  goalText: string;
  color: string;
  met?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <ProgressRing progress={goal > 0 ? eaten / goal : 0} color={color} size={66} stroke={6}>
        <span className="text-[15px] leading-none font-bold" style={{ color }}>
          <AnimatedNumber value={eaten} />
        </span>
        {met && <Check size={11} strokeWidth={3} className="mt-0.5 text-forest" aria-label="target met" />}
      </ProgressRing>
      <span className="text-[11px] font-semibold text-espresso">{label}</span>
      <span className="-mt-1 text-[10px] text-warm-grey tabular">{goalText}</span>
    </div>
  );
}

const ROW_LABEL: Record<NutrientKey, string> = { kcal: 'kcal', protein: 'P', carbs: 'C', fat: 'F', fibre: 'Fibre' };

/** LOG-6 running totals (planned vs eaten) + LOG-7 target rings with §4.4 warning colours. */
export function TargetsPanel({ totals, status }: { totals: DayTotals; status: TargetStatus }) {
  const { kcal, protein, fat, fibre } = status;
  // Planned kcal includes the free-slot budget (that is what "eaten" will include too); macros don't.
  const planned = totals.plannedWithSnack;

  return (
    <section aria-label="Today's targets" className="rounded-[22px] border border-gold/35 bg-porcelain/90 px-3 pt-3.5 pb-3 shadow-card">
      <div className="grid grid-cols-4 gap-1">
        <Ring
          label="Calories"
          eaten={kcal.eaten}
          goal={kcal.target}
          goalText={`of ${fmt(kcal.target)}`}
          color={kcal.over ? COLOR.terracotta : COLOR.forest}
        />
        <Ring label="Protein" eaten={protein.eaten} goal={protein.min} goalText={`min ${fmt(protein.min)}g`} color={minColor(protein)} met={protein.status === 'met'} />
        <Ring label="Fat" eaten={fat.eaten} goal={fat.min} goalText={`min ${fmt(fat.min)}g`} color={minColor(fat)} met={fat.status === 'met'} />
        <Ring label="Fibre" eaten={fibre.eaten} goal={fibre.min} goalText={`min ${fmt(fibre.min)}g`} color={minColor(fibre)} met={fibre.status === 'met'} />
      </div>

      {/* Short warnings in words, so colour isn't the only signal. */}
      {(kcal.over || [protein, fat, fibre].some((t) => t.status === 'warning')) && (
        <p className="mt-2.5 text-center text-[11.5px] leading-snug text-terracotta">
          {[
            kcal.over && `${fmt(kcal.eaten - kcal.target)} kcal over target`,
            protein.status === 'warning' && `protein on course for ${fmt(protein.projected)}g`,
            fat.status === 'warning' && `fat on course for ${fmt(fat.projected)}g`,
            fibre.status === 'warning' && `fibre on course for ${fmt(fibre.projected)}g`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}

      <table className="mt-3 w-full border-t border-gold/30 text-center text-[11.5px] tabular">
        <thead>
          <tr className="text-[10px] tracking-wider text-warm-grey uppercase">
            <th className="pt-2 text-left font-medium" />
            {NUTRIENT_KEYS.map((k) => (
              <th key={k} className="pt-2 font-medium">
                {ROW_LABEL[k]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="font-bold text-forest">
            <th className="pt-1 text-left text-[11px] font-semibold text-espresso">Eaten</th>
            {NUTRIENT_KEYS.map((k) => (
              <td key={k} className="pt-1">
                <AnimatedNumber value={totals.eaten[k]} />
              </td>
            ))}
          </tr>
          <tr className="text-warm-grey">
            <th className="text-left text-[11px] font-medium">Planned</th>
            {NUTRIENT_KEYS.map((k) => (
              <td key={k}>{fmt(planned[k])}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </section>
  );
}
