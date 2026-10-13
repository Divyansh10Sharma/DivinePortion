import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Photo } from '../../lib/types';
import { PlatePlaceholder } from '../cards/PlatePlaceholder';

/**
 * Shows a stored photo, filling its (circular) parent. PHOTO-5: no photo → porcelain plate placeholder.
 * PHOTO-3: the ArrayBuffer is turned into a Blob + object URL only while mounted, and the URL is
 * revoked on unmount/change. The URL is assigned to the <img> directly in an effect (no state),
 * so React StrictMode's double effects just create and revoke a second URL.
 * ANIM-9: the tiny blurred thumbnail shows immediately; the full image fades in over it once decoded.
 */
export function PhotoView({ photoId, size, alt = '' }: { photoId: string | undefined; size: number; alt?: string }) {
  // undefined = still loading, null = not found (e.g. cleaned up) → placeholder.
  const photo = useLiveQuery(async () => (photoId ? ((await db.photos.get(photoId)) ?? null) : null), [photoId]);
  if (!photoId || photo === null) return <PlatePlaceholder size={size} />;
  // Still loading a real photo → a neutral porcelain disc instead of flashing the plate placeholder.
  if (photo === undefined) return <div className="h-full w-full rounded-full bg-porcelain" />;
  return <LoadedPhoto key={photo.id} photo={photo} alt={alt} />;
}

function LoadedPhoto({ photo, alt }: { photo: Photo; alt: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const url = URL.createObjectURL(new Blob([photo.data], { type: photo.mimeType }));
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-full bg-porcelain">
      {/* blur-up placeholder: a 24px JPEG scaled up and blurred (scaled slightly so blurred edges don't show) */}
      <img src={photo.thumbDataUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-md" />
      <motion.img
        ref={imgRef}
        alt={alt}
        decoding="async"
        draggable={false}
        onLoad={() => setLoaded(true)}
        initial={false}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
