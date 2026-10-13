import type { MealIcon } from '../../lib/types';
import { MEAL_ICONS } from '../icons/registry';
import { MealGlyph } from '../icons/icons';

/** PLAN-3: forest-green circles with cream glyphs; the chosen one gets a gold ring. */
export function IconPicker({ value, onChange }: { value: MealIcon; onChange: (icon: MealIcon) => void }) {
  return (
    <div role="radiogroup" aria-label="Timeline icon" className="grid grid-cols-5 gap-2.5">
      {Object.keys(MEAL_ICONS).map((key) => {
        const selected = key === value;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={key}
            onClick={() => onChange(key)}
            className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full transition-[box-shadow,opacity] ${
              selected ? 'bg-forest text-cream ring-[3px] ring-gold ring-offset-2 ring-offset-porcelain' : 'bg-forest/85 text-cream/90 opacity-70'
            }`}
          >
            <MealGlyph icon={key} size={20} strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}
