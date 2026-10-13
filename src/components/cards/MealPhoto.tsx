import { PlatePlaceholder } from './PlatePlaceholder';

/**
 * White circular "plate" frame with a subtle rim (§6.3).
 * Phase 4 adds real photos; until then (and for meals without one) the porcelain placeholder shows.
 */
export function MealPhoto({ size = 64 }: { size?: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full bg-porcelain p-[3px] shadow-[0_1px_2px_rgb(42_36_32/0.08),0_6px_14px_-6px_rgb(42_36_32/0.18)] ring-1 ring-[#E4DACA]"
      style={{ width: size, height: size }}
    >
      <div className="h-full w-full overflow-hidden rounded-full">
        <PlatePlaceholder size={size - 6} />
      </div>
    </div>
  );
}
