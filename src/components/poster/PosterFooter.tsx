import { Fragment } from 'react';
import type { Settings } from '../../lib/types';
import { FooterGlyph } from '../icons/icons';

/** HOME-8: three columns with icons separated by gold hairlines; content from Settings.footerItems. */
export function PosterFooter({ items }: { items: Settings['footerItems'] }) {
  return (
    <footer className="mt-5 flex items-stretch justify-center px-1">
      {items.map((item, i) => {
        return (
          <Fragment key={i}>
            {i > 0 && <span aria-hidden className="w-px shrink-0 bg-gold/70" />}
            <div className="flex flex-1 flex-col items-center gap-1.5 px-2 py-1 text-center">
              <FooterGlyph icon={item.icon} size={20} strokeWidth={1.6} className="text-forest" />
              <span className="text-[11px] leading-tight font-medium text-espresso">{item.text}</span>
            </div>
          </Fragment>
        );
      })}
    </footer>
  );
}
