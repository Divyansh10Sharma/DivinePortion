import { useEffect, useState } from 'react';
import { getPersistenceStatus, type PersistenceStatus } from '../lib/storage';
import { ComingSoon, ScreenShell } from './PlaceholderScreen';

const STATUS_LABEL: Record<PersistenceStatus, string> = {
  persistent: 'persistent',
  'may-be-evicted': 'may be evicted',
  unsupported: 'may be evicted (persistence not supported)',
};

/** Phase 1: storage persistence status (IOS-10) + app version. Full settings arrive in Phase 5. */
export function SettingsScreen() {
  const [status, setStatus] = useState<PersistenceStatus | null>(null);

  useEffect(() => {
    let alive = true;
    void getPersistenceStatus().then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ScreenShell title="Settings">
      <dl className="divide-y divide-gold/30 rounded-[22px] bg-porcelain px-4 shadow-card">
        <div className="flex justify-between gap-4 py-3.5 text-[14px]">
          <dt className="text-espresso">Storage</dt>
          <dd className={status === 'persistent' ? 'text-forest' : 'text-terracotta'}>
            {status ? STATUS_LABEL[status] : '…'}
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-3.5 text-[14px]">
          <dt className="text-espresso">Version</dt>
          <dd className="text-warm-grey tabular">{__APP_VERSION__}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <ComingSoon phase={5} what="targets, footer items, backup & import" />
      </div>
    </ScreenShell>
  );
}
