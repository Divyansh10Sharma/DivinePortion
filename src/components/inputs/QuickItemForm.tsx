import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { parseDecimal } from '../../lib/format';
import type { Nutrition } from '../../lib/types';

export interface QuickItemValues extends Nutrition {
  name: string;
  amount?: number;
  unit?: string;
}

type Field = 'name' | 'amount' | 'unit' | 'kcal' | 'protein' | 'carbs' | 'fat' | 'fibre';
const EMPTY: Record<Field, string> = { name: '', amount: '', unit: '', kcal: '', protein: '', carbs: '', fat: '', fibre: '' };

const MACROS: { key: 'protein' | 'carbs' | 'fat' | 'fibre'; label: string }[] = [
  { key: 'protein', label: 'P (g)' },
  { key: 'carbs', label: 'C (g)' },
  { key: 'fat', label: 'F (g)' },
  { key: 'fibre', label: 'Fibre' },
];

const inputClass =
  'w-full rounded-xl border border-gold/50 bg-white/80 px-3 py-2 text-espresso outline-none placeholder:text-warm-grey/70 focus:border-forest focus:ring-2 focus:ring-forest/15';

/**
 * Quick entry for today-only extras (LOG-4, with amount + unit) and free-slot entries
 * (LOG-5, name + kcal + optional macros). Name and kcal are required; macros default to 0.
 */
export function QuickItemForm({
  withAmount,
  submitLabel,
  onSubmit,
}: {
  withAmount: boolean;
  submitLabel: string;
  onSubmit: (values: QuickItemValues) => void;
}) {
  const [f, setF] = useState(EMPTY);
  const [touched, setTouched] = useState(false);

  const set = (k: Field) => (e: { target: { value: string } }) => setF((prev) => ({ ...prev, [k]: e.target.value }));
  const num = (k: Field) => parseDecimal(f[k]);
  const kcal = num('kcal');
  const nameOk = f.name.trim().length > 0;
  const kcalOk = kcal !== undefined && Number.isFinite(kcal);
  const macrosOk = (['amount', 'protein', 'carbs', 'fat', 'fibre'] as const).every((k) => {
    const v = num(k);
    return v === undefined || Number.isFinite(v);
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!nameOk || !kcalOk || !macrosOk) return;
    const values: QuickItemValues = {
      name: f.name.trim(),
      kcal: kcal!,
      protein: num('protein') ?? 0,
      carbs: num('carbs') ?? 0,
      fat: num('fat') ?? 0,
      fibre: num('fibre') ?? 0,
    };
    if (withAmount) {
      values.amount = num('amount') ?? 1;
      values.unit = f.unit.trim() || 'serving';
    }
    onSubmit(values);
    setF(EMPTY);
    setTouched(false);
  }

  return (
    <form onSubmit={submit} className="space-y-2.5" noValidate>
      <input className={inputClass} placeholder="What did you eat?" value={f.name} onChange={set('name')} enterKeyHint="next" />
      <div className="grid grid-cols-3 gap-2">
        {withAmount && (
          <>
            <input className={inputClass} placeholder="Amount" inputMode="decimal" value={f.amount} onChange={set('amount')} />
            <input className={inputClass} placeholder="Unit" value={f.unit} onChange={set('unit')} list="plate-units" />
          </>
        )}
        <input
          className={`${inputClass} ${withAmount ? '' : 'col-span-3'}`}
          placeholder="kcal *"
          inputMode="decimal"
          value={f.kcal}
          onChange={set('kcal')}
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {MACROS.map(({ key, label }) => (
          <input key={key} className={inputClass} placeholder={label} inputMode="decimal" value={f[key]} onChange={set(key)} />
        ))}
      </div>
      <datalist id="plate-units">
        {['g', 'ml', 'piece', 'sachet', 'scoop', 'pinch', 'serving'].map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      {touched && (!nameOk || !kcalOk || !macrosOk) && (
        <p className="text-[12.5px] text-terracotta">
          {!nameOk ? 'Add a name. ' : ''}
          {!kcalOk ? 'Enter kcal as a number. ' : ''}
          {!macrosOk ? 'Amounts and macros must be numbers.' : ''}
        </p>
      )}
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-forest py-2.5 text-[14px] font-semibold text-cream active:scale-[0.98]"
      >
        <Plus size={16} strokeWidth={2.2} aria-hidden />
        {submitLabel}
      </button>
    </form>
  );
}
