import { createElement } from 'react';
import type { LucideProps } from 'lucide-react';
import type { FooterIcon } from '../../lib/types';
import { footerIconComponent } from './registry';

// The icon components are static module-level lucide components looked up by key;
// createElement keeps that lookup out of JSX so it isn't mistaken for a component created during render.

/** Poster-footer icon (SET-2). v2: meal timeline icons were dropped (owner request). */
export function FooterGlyph({ icon, ...props }: { icon: FooterIcon } & LucideProps) {
  return createElement(footerIconComponent(icon), { 'aria-hidden': true, ...props });
}
