import type { ReactNode } from 'react';

/** Label + control + optional hint, used throughout the plan editor. */
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] text-olive uppercase">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] leading-snug text-warm-grey">{hint}</span>}
    </label>
  );
}

/** iOS-style switch. */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between py-1 text-[15px] text-espresso"
    >
      <span>{label}</span>
      <span className={`relative h-[30px] w-[50px] rounded-full transition-colors ${checked ? 'bg-forest' : 'bg-warm-grey/35'}`}>
        <span
          className={`absolute top-[3px] left-[3px] h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </span>
    </button>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 mb-2 font-serif text-[18px] font-semibold text-forest">{children}</h3>;
}
