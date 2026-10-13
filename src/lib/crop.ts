// Crop maths for the photo crop screen (owner-requested addition to Phase 4).
//
// The crop viewport is a square of side V (CSS px). The image (w × h, in preview pixels) is drawn
// at `scale` with its top-left corner at (x, y) relative to the viewport. The image must always
// cover the whole viewport, so: scale ≥ coverScale, and x ∈ [V − w·scale, 0], y ∈ [V − h·scale, 0].

export interface CropView {
  scale: number;
  x: number;
  y: number;
}

/** How far you can zoom in beyond "just covers the square". */
export const MAX_ZOOM = 5;

export function coverScale(w: number, h: number, V: number): number {
  return Math.max(V / w, V / h);
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Fits the image to cover the square, centred. */
export function initialView(w: number, h: number, V: number): CropView {
  const scale = coverScale(w, h, V);
  return { scale, x: (V - w * scale) / 2, y: (V - h * scale) / 2 };
}

/** Keeps the scale in range and the square fully covered. */
export function clampView(v: CropView, w: number, h: number, V: number): CropView {
  const min = coverScale(w, h, V);
  const scale = clamp(v.scale, min, min * MAX_ZOOM);
  return { scale, x: clamp(v.x, V - w * scale, 0), y: clamp(v.y, V - h * scale, 0) };
}

export function panBy(v: CropView, dx: number, dy: number, w: number, h: number, V: number): CropView {
  return clampView({ ...v, x: v.x + dx, y: v.y + dy }, w, h, V);
}

/** Zooms by `factor` keeping the point (px, py) of the viewport fixed under the finger/cursor. */
export function zoomAt(v: CropView, factor: number, px: number, py: number, w: number, h: number, V: number): CropView {
  const min = coverScale(w, h, V);
  const scale = clamp(v.scale * factor, min, min * MAX_ZOOM);
  const ratio = scale / v.scale;
  return clampView({ scale, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio }, w, h, V);
}

/** Zoom level (1 = cover … MAX_ZOOM) for the slider. */
export function zoomLevel(v: CropView, w: number, h: number, V: number): number {
  return v.scale / coverScale(w, h, V);
}

/** The square of the image (in the image's own pixels) that is inside the viewport. */
export function sourceSquare(v: CropView, V: number): { sx: number; sy: number; size: number } {
  return { sx: -v.x / v.scale, sy: -v.y / v.scale, size: V / v.scale };
}
