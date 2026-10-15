import { useEffect, useRef, useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, Download, FileUp, Loader2, Moon, Share, Sun } from 'lucide-react';
import { getPersistenceStatus, type PersistenceStatus } from '../lib/storage';
import { lastBackupLabel, parseBackup, type BackupFile, type BackupSummary } from '../lib/backup';
import type { FooterIcon, Settings } from '../lib/types';
import { importAll } from '../db/backup';
import { SCHEMA_VERSION } from '../db/seed';
import { updateSettings } from '../db/settings';
import { prepareExport, resetExport, saveExport, useExportState } from '../hooks/backupFlow';
import { TextInput } from '../components/inputs/TextInput';
import { ConfirmDialog } from '../components/dialog/ConfirmDialog';
import { FooterGlyph } from '../components/icons/icons';
import { showToast } from '../components/toast/toastStore';
import { applyTheme, DEFAULT_THEME, type Theme } from '../lib/theme';

const STATUS_LABEL: Record<PersistenceStatus, string> = {
  persistent: 'persistent',
  'may-be-evicted': 'may be evicted',
  unsupported: 'may be evicted (persistence not supported)',
};

const FOOTER_ICON_CHOICES: FooterIcon[] = ['droplet', 'leaf', 'coffee', 'clock', 'sun', 'moon', 'apple', 'star', 'sparkle'];

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 font-serif text-[19px] font-semibold text-forest">{title}</h2>
      <div className="rounded-[22px] bg-porcelain px-4 py-1 shadow-card">{children}</div>
    </section>
  );
}

function Row({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="border-b border-gold/30 py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-4 text-[14.5px]">
        <span className="text-espresso">{label}</span>
        <span className="min-w-0 text-right">{children}</span>
      </div>
      {hint && <p className="mt-1 text-[12px] leading-snug text-warm-grey">{hint}</p>}
    </div>
  );
}

/** Settings (SET-2 … SET-7), opened from the gear on Today (v2 redesign). */
export function SettingsScreen({ settings, onBack }: { settings: Settings; onBack: () => void }) {
  const [status, setStatus] = useState<PersistenceStatus | null>(null);
  const [pendingImport, setPendingImport] = useState<{ backup: BackupFile; summary: BackupSummary } | null>(null);
  const exportState = useExportState();
  const importInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    void getPersistenceStatus().then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, []);

  // ---- export (SET-3) ----------------------------------------------------
  async function onSave() {
    try {
      const r = await saveExport();
      if (r === 'shared') showToast({ message: 'Backup saved' });
      if (r === 'downloaded') showToast({ message: 'Backup downloaded' });
    } catch {
      showToast({ message: "Couldn't share the backup. Try again." });
    }
  }

  // ---- import (SET-4) ----------------------------------------------------
  async function onImportFile(file: File | undefined) {
    if (importInput.current) importInput.current.value = '';
    if (!file) return;
    const result = parseBackup(await file.text(), SCHEMA_VERSION);
    if (!result.ok) {
      showToast({ message: result.error, durationMs: 7000 });
      return;
    }
    setPendingImport({ backup: result.backup, summary: result.summary });
  }

  async function confirmImport() {
    if (!pendingImport) return;
    const { backup } = pendingImport;
    setPendingImport(null);
    try {
      await importAll(backup);
      showToast({ message: 'Backup restored' });
    } catch {
      showToast({ message: 'Import failed — nothing was changed.', durationMs: 7000 });
    }
  }

  const importMessage = pendingImport ? describeImport(pendingImport.summary) : '';

  return (
    <div className="mx-auto max-w-[480px] px-4 pt-6">
      <button onClick={onBack} className="-ml-1 flex items-center gap-0.5 text-[14px] font-semibold text-forest">
        <ChevronLeft size={18} aria-hidden /> Today
      </button>
      <h1 className="mt-2 font-serif text-[28px] font-bold text-forest">Settings</h1>

      {/* Appearance (owner request after Phase 6) */}
      <Card title="Appearance">
        <div className="py-3">
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-1 rounded-full bg-field p-1">
            {(
              [
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'light', label: 'Light', icon: Sun },
              ] as { id: Theme; label: string; icon: typeof Moon }[]
            ).map(({ id, label, icon: Icon }) => {
              const selected = (settings.theme ?? DEFAULT_THEME) === id;
              return (
                <button
                  key={id}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    applyTheme(id); // instant, before the DB round-trip
                    void updateSettings((s) => ({ ...s, theme: id }));
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-[14px] font-semibold ${
                    selected ? 'bg-forest text-cream' : 'text-forest'
                  }`}
                >
                  <Icon size={16} aria-hidden /> {label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[12px] leading-snug text-warm-grey">
            On the installed iPhone app, the status-bar colour follows after the next launch.
          </p>
        </div>
      </Card>

      {/* SET-2 */}
      <Card title="Poster footer">
        {settings.footerItems.map((item, i) => (
          <div key={i} className="border-b border-gold/30 py-3 last:border-b-0">
            <TextInput
              aria-label={`Footer item ${i + 1} text`}
              value={item.text}
              onCommit={(text) =>
                void updateSettings((s) => ({ ...s, footerItems: s.footerItems.map((f, j) => (j === i ? { ...f, text } : f)) }))
              }
            />
            <div role="radiogroup" aria-label={`Footer item ${i + 1} icon`} className="mt-2 flex flex-wrap gap-1.5">
              {FOOTER_ICON_CHOICES.map((icon) => {
                const selected = icon === item.icon;
                return (
                  <button
                    key={icon}
                    role="radio"
                    aria-checked={selected}
                    aria-label={icon}
                    onClick={() =>
                      void updateSettings((s) => ({ ...s, footerItems: s.footerItems.map((f, j) => (j === i ? { ...f, icon } : f)) }))
                    }
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      selected ? 'bg-forest text-cream ring-2 ring-gold ring-offset-1 ring-offset-porcelain' : 'bg-sage text-forest'
                    }`}
                  >
                    <FooterGlyph icon={icon} size={17} strokeWidth={1.7} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Card>

      {/* SET-3 / SET-4 / SET-5 */}
      <Card title="Backup">
        <Row label="Last backup">
          <span className={settings.lastBackupAt ? 'text-forest' : 'text-terracotta'}>{lastBackupLabel(settings.lastBackupAt)}</span>
        </Row>
        <div className="space-y-2.5 py-3">
          {exportState.kind === 'ready' ? (
            <>
              <button
                onClick={() => void onSave()}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-forest py-2.5 text-[14.5px] font-semibold text-cream"
              >
                <Share size={17} aria-hidden /> Save backup file
              </button>
              <p className="text-center text-[12px] text-warm-grey">
                {exportState.file.name} · {exportState.sizeKb} KB ·{' '}
                <button onClick={resetExport} className="font-semibold text-olive underline">
                  cancel
                </button>
              </p>
            </>
          ) : (
            <button
              onClick={() => void prepareExport()}
              disabled={exportState.kind === 'preparing'}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-forest py-2.5 text-[14.5px] font-semibold text-cream disabled:opacity-60"
            >
              {exportState.kind === 'preparing' ? <Loader2 size={17} className="animate-spin" aria-hidden /> : <Download size={17} aria-hidden />}
              {exportState.kind === 'preparing' ? 'Preparing…' : 'Export backup'}
            </button>
          )}
          {exportState.kind === 'error' && <p className="text-center text-[12.5px] text-terracotta">{exportState.message}</p>}
          <button
            onClick={() => importInput.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-forest/50 py-2.5 text-[14.5px] font-semibold text-forest"
          >
            <FileUp size={17} aria-hidden /> Import backup
          </button>
          <input
            ref={importInput}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => void onImportFile(e.target.files?.[0])}
          />
          <p className="text-[12px] leading-snug text-warm-grey">
            The file holds everything: settings, your meals, Your items, saved plans and all photos. On iPhone choose “Save to Files” and keep it in iCloud
            Drive — iOS can clear app data that isn't used for a while.
          </p>
        </div>
      </Card>

      {/* SET-7 */}
      <Card title="About">
        <Row label="Storage">
          <span className={status === 'persistent' ? 'text-forest' : 'text-terracotta'}>{status ? STATUS_LABEL[status] : '…'}</span>
        </Row>
        <Row label="Version">
          <span className="text-warm-grey tabular">{__APP_VERSION__}</span>
        </Row>
      </Card>

      <ConfirmDialog
        open={!!pendingImport}
        title="Replace all data?"
        message={importMessage}
        confirmLabel="Replace"
        cancelLabel="Cancel"
        onConfirm={() => void confirmImport()}
        onCancel={() => setPendingImport(null)}
      />
    </div>
  );
}

/** SET-4 summary: days, photos, date range. */
function describeImport(s: BackupSummary): string {
  const n = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
  const parts = [n(s.meals, 'meal'), n(s.items, 'item'), n(s.savedPlans, 'saved plan'), n(s.photos, 'photo')];
  return `This backup from ${format(new Date(s.exportedAt), 'd MMM yyyy, HH:mm')} has ${parts.join(', ')}. Everything currently in the app will be replaced.`;
}
