import { motion } from 'motion/react';
import { CalendarDays, NotebookPen, Settings, Sun, type LucideIcon } from 'lucide-react';
import type { Tab } from '../../hooks/useActiveTab';

const ITEMS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'today', label: 'Today', icon: Sun },
  { id: 'history', label: 'History', icon: CalendarDays },
  { id: 'plan', label: 'Plan', icon: NotebookPen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/**
 * NAV-1: frosted cream glass, gold hairline on top, active tab in forest green.
 * Bottom padding = home-indicator safe area (IOS-2).
 */
export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="frosted absolute inset-x-0 bottom-0 z-30 border-t border-gold/60"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div role="tablist" className="mx-auto flex h-[56px] max-w-[480px] items-stretch">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(id)}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium transition-colors ${
                isActive ? 'text-forest' : 'text-warm-grey'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute top-0 h-[2px] w-8 rounded-full bg-forest"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <Icon size={22} strokeWidth={isActive ? 2 : 1.6} aria-hidden />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Height of the bar above the safe area — screens pad their bottom by this + the inset. */
export const TAB_BAR_HEIGHT = 56;
