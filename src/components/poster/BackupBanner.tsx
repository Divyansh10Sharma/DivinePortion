import { motion } from 'motion/react';
import { CloudUpload, X } from 'lucide-react';
import { lastBackupLabel } from '../../lib/backup';

/** SET-5: gentle cream reminder on Today when the last backup is over 7 days old (dismissible for 24 h). */
export function BackupBanner({ lastBackupAt, onBackup, onDismiss }: { lastBackupAt: number | undefined; onBackup: () => void; onDismiss: () => void }) {
  const label = lastBackupAt ? `Last backup ${lastBackupLabel(lastBackupAt).toLowerCase()}.` : 'No backup yet.';
  return (
    <motion.div
      role="note"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4 flex items-center gap-3 rounded-[18px] border border-gold/50 bg-porcelain px-3.5 py-3 shadow-card"
    >
      <CloudUpload size={20} className="shrink-0 text-olive" aria-hidden />
      <p className="min-w-0 flex-1 text-[13px] leading-snug text-espresso">
        {label} <span className="text-warm-grey">Keep a copy in Files — iOS can clear app data.</span>
      </p>
      <button onClick={onBackup} className="shrink-0 rounded-full bg-forest px-3 py-1.5 text-[12.5px] font-semibold text-cream">
        Back up now
      </button>
      <button onClick={onDismiss} aria-label="Dismiss for a day" className="-mr-1 shrink-0 p-1 text-warm-grey">
        <X size={16} />
      </button>
    </motion.div>
  );
}
