// Client-side photo processing (PHOTO-2, PHOTO-4).
// - Max 1000 px on the long edge, JPEG at quality 0.8. iOS Safari's canvas can't encode WebP,
//   so we always ask for JPEG and record whatever MIME type the browser actually produced.
// - EXIF orientation: createImageBitmap(file, { imageOrientation: 'from-image' }) applies it.
//   Fallback: an <img> element, which modern Safari/Chrome also draw EXIF-rotated
//   (CSS `image-orientation: from-image` is the default since iOS 13.4).
// - A ~24 px thumbnail data URL is stored for the blur-up placeholder (ANIM-9).

export const MAX_EDGE = 1000;
export const JPEG_QUALITY = 0.8;
export const THUMB_EDGE = 24;

export interface ProcessedImage {
  data: ArrayBuffer;
  mimeType: string;
  width: number;
  height: number;
  thumbDataUrl: string;
}

/** Scale (w, h) down so the long edge is ≤ max; never upscales. Integer pixels, at least 1. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

type Drawable = ImageBitmap | HTMLImageElement;

async function decode(file: Blob): Promise<{ source: Drawable; width: number; height: number; close: () => void }> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  } catch {
    // Older Safari: no options support / no createImageBitmap for this type.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      await img.decode();
      return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function draw(source: Drawable, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  // JPEG has no alpha: paint cream first so transparent PNGs don't turn black.
  ctx.fillStyle = '#F6F1E7';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the image'))), type, quality),
  );
}

export async function processImage(file: Blob): Promise<ProcessedImage> {
  const decoded = await decode(file);
  try {
    const size = fitWithin(decoded.width, decoded.height, MAX_EDGE);
    const blob = await toBlob(draw(decoded.source, size.width, size.height), 'image/jpeg', JPEG_QUALITY);
    const thumb = fitWithin(size.width, size.height, THUMB_EDGE);
    const thumbDataUrl = draw(decoded.source, thumb.width, thumb.height).toDataURL('image/jpeg', 0.7);
    return {
      data: await blob.arrayBuffer(),
      // Verify rather than assume: if the browser fell back to PNG, store PNG.
      mimeType: blob.type || 'image/jpeg',
      width: size.width,
      height: size.height,
      thumbDataUrl,
    };
  } finally {
    decoded.close();
  }
}
