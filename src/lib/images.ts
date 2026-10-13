// Client-side photo processing (PHOTO-2, PHOTO-4).
// - Max 1000 px on the long edge, JPEG at quality 0.8. iOS Safari's canvas can't encode WebP,
//   so we always ask for JPEG and record whatever MIME type the browser actually produced.
// - EXIF orientation: createImageBitmap(file, { imageOrientation: 'from-image' }) applies it.
//   Fallback: an <img> element, which modern Safari/Chrome also draw EXIF-rotated
//   (CSS `image-orientation: from-image` is the default since iOS 13.4).
// - A ~24 px thumbnail data URL is stored for the blur-up placeholder (ANIM-9).
// - Optional crop (owner request): the crop screen picks a square; only that square is encoded.

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

/** A decoded, correctly oriented image. Call `close()` when done (frees the ImageBitmap). */
export interface DecodedImage {
  source: Drawable;
  width: number;
  height: number;
  close: () => void;
}

/** Source square to crop, in the decoded image's pixels (from the crop screen). */
export interface SourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export async function decodeImage(file: Blob): Promise<DecodedImage> {
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

function draw(source: Drawable, width: number, height: number, rect?: SourceRect): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  // JPEG has no alpha: paint cream first so transparent PNGs don't turn black.
  ctx.fillStyle = '#F6F1E7';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  if (rect) ctx.drawImage(source, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, width, height);
  else ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the image'))), type, quality),
  );
}

/** Encodes the whole image, or just `rect` of it (crop), at ≤ MAX_EDGE px plus the blur thumbnail. */
export async function encodeImage(decoded: DecodedImage, rect?: SourceRect): Promise<ProcessedImage> {
  const w = rect ? rect.sw : decoded.width;
  const h = rect ? rect.sh : decoded.height;
  const size = fitWithin(w, h, MAX_EDGE);
  const blob = await toBlob(draw(decoded.source, size.width, size.height, rect), 'image/jpeg', JPEG_QUALITY);
  const thumb = fitWithin(size.width, size.height, THUMB_EDGE);
  const thumbDataUrl = draw(decoded.source, thumb.width, thumb.height, rect).toDataURL('image/jpeg', 0.7);
  return {
    data: await blob.arrayBuffer(),
    // Verify rather than assume: if the browser fell back to PNG, store PNG.
    mimeType: blob.type || 'image/jpeg',
    width: size.width,
    height: size.height,
    thumbDataUrl,
  };
}

/** Decode + encode the whole image (no crop). */
export async function processImage(file: Blob): Promise<ProcessedImage> {
  const decoded = await decodeImage(file);
  try {
    return await encodeImage(decoded);
  } finally {
    decoded.close();
  }
}

/** A downscaled copy for on-screen preview (huge camera images are heavy to transform on iOS). */
export function drawPreview(decoded: DecodedImage, canvas: HTMLCanvasElement, maxEdge = 1600): { width: number; height: number } {
  const size = fitWithin(decoded.width, decoded.height, maxEdge);
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(decoded.source, 0, 0, size.width, size.height);
  }
  return size;
}
