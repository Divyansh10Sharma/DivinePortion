import { createContext, useContext, type RefObject } from 'react';

/**
 * The Today screen's scroll container (each tab scrolls inside its own <main>, IOS-6).
 * ANIM-10's parallax needs it for `useScroll({ container })`, since the window itself never scrolls.
 */
export const ScrollContainerContext = createContext<RefObject<HTMLElement | null> | null>(null);

export function useScrollContainer(): RefObject<HTMLElement | null> | null {
  return useContext(ScrollContainerContext);
}
