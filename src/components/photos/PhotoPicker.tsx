import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { processImage } from '../../lib/images';
import { savePhoto, scheduleOrphanCleanup } from '../../db/photos';
import { showToast } from '../toast/toastStore';
import { PhotoView } from './PhotoView';

/**
 * PHOTO-1: <input type="file" accept="image/*"> — on iPhone this offers Take Photo / Photo Library.
 * The file is compressed (PHOTO-2) and stored (PHOTO-3) before `onChange` receives the new id.
 * Replace = pick again; Remove = onChange(undefined). The old photo is cleaned up later if nothing
 * else (e.g. a past day) still uses it (PHOTO-6).
 */
export function PhotoPicker({
  photoId,
  onChange,
  size = 72,
  label = 'photo',
}: {
  photoId: string | undefined;
  onChange: (photoId: string | undefined) => void;
  size?: number;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const id = await savePhoto(await processImage(file));
      onChange(id);
      if (photoId) scheduleOrphanCleanup();
    } catch {
      showToast({ message: "Couldn't read that image. Try another photo." });
    } finally {
      setBusy(false);
      // Allow picking the same file again.
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="flex items-center gap-3.5">
      <button
        type="button"
        onClick={() => input.current?.click()}
        aria-label={photoId ? `Replace ${label}` : `Add ${label}`}
        className="relative shrink-0 rounded-full bg-porcelain p-[3px] shadow-[0_1px_2px_rgb(42_36_32/0.08),0_6px_14px_-6px_rgb(42_36_32/0.18)] ring-1 ring-[#E4DACA]"
        style={{ width: size, height: size }}
      >
        <PhotoView photoId={photoId} size={size - 6} />
        <span className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-forest text-cream ring-2 ring-porcelain">
          {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Camera size={14} aria-hidden />}
        </span>
      </button>
      <div className="flex flex-col items-start gap-1.5">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="rounded-full border border-forest/50 px-3.5 py-1.5 text-[13px] font-semibold text-forest disabled:opacity-50"
        >
          {busy ? 'Saving…' : photoId ? 'Replace photo' : 'Add photo'}
        </button>
        {photoId && !busy && (
          <button
            type="button"
            onClick={() => {
              onChange(undefined);
              scheduleOrphanCleanup();
            }}
            className="flex items-center gap-1 px-1 text-[12.5px] font-semibold text-terracotta"
          >
            <Trash2 size={13} aria-hidden /> Remove
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </div>
  );
}
