import type { ReactNode } from 'react';

/** Simple titled screen used by tabs that arrive in later phases (NAV-1, Phase 1). */
export function ScreenShell({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-[480px] px-4 pt-6">
      <h1 className="font-serif text-[28px] font-bold text-forest">{title}</h1>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function ComingSoon({ phase, what }: { phase: number; what: string }) {
  return (
    <div className="rounded-[22px] border border-gold/40 bg-porcelain p-5 text-[14px] leading-relaxed text-warm-grey shadow-card">
      Coming in Phase {phase}: {what}.
    </div>
  );
}
