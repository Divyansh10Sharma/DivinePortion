import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { clampView, coverScale, initialView, MAX_ZOOM, panBy, sourceSquare, zoomAt, zoomLevel, type CropView } from '../../lib/crop';
import { drawPreview, fitWithin, type DecodedImage, type SourceRect } from '../../lib/images';
import { useUiLock } from '../../lib/uiLocks';

const PREVIEW_EDGE = 1600;

/**
 * Crop screen shown after a photo is picked (owner-requested addition to Phase 4; the iOS file
 * picker has no crop step for web pages). Drag to move, pinch (or the slider / mouse wheel) to zoom.
 * The circle shows how the photo will look in the round frames; the square around it is what's saved.
 * Gestures are handled with raw pointer events: one pointer pans, two pointers pinch around their midpoint.
 */
export function CropDialog({
  image,
  onCancel,
  onConfirm,
}: {
  image: DecodedImage;
  onCancel: () => void;
  onConfirm: (rect: SourceRect) => void;
}) {
  useUiLock(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Viewport side: fits a 360–430 px phone with gutters.
  const [V] = useState(() => Math.min(window.innerWidth - 48, 340));
  const preview = fitWithin(image.width, image.height, PREVIEW_EDGE);
  const { width: w, height: h } = preview;
  const [view, setView] = useState<CropView>(() => initialView(w, h, V));
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  useEffect(() => {
    if (canvasRef.current) drawPreview(image, canvasRef.current, PREVIEW_EDGE);
  }, [image]);

  const local = (e: { clientX: number; clientY: number }, el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, local(e, e.currentTarget));
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const map = pointers.current;
    const prev = map.get(e.pointerId);
    if (!prev) return;
    const next = local(e, e.currentTarget);

    if (map.size === 1) {
      map.set(e.pointerId, next);
      setView((v) => panBy(v, next.x - prev.x, next.y - prev.y, w, h, V));
      return;
    }
    // Pinch: compare the two-finger distance and midpoint before / after this move.
    const [a, b] = [...map.entries()].map(([id, p]) => (id === e.pointerId ? { before: p, after: next } : { before: p, after: p }));
    if (!a || !b) return;
    map.set(e.pointerId, next);
    const dist = (p: { x: number; y: number }, q: { x: number; y: number }) => Math.hypot(p.x - q.x, p.y - q.y) || 1;
    const factor = dist(a.after, b.after) / dist(a.before, b.before);
    const mid = { x: (a.after.x + b.after.x) / 2, y: (a.after.y + b.after.y) / 2 };
    const midBefore = { x: (a.before.x + b.before.x) / 2, y: (a.before.y + b.before.y) / 2 };
    setView((v) => panBy(zoomAt(v, factor, mid.x, mid.y, w, h, V), mid.x - midBefore.x, mid.y - midBefore.y, w, h, V));
  }

  function onPointerEnd(e: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
  }

  function onWheel(e: WheelEvent<HTMLDivElement>) {
    const p = local(e, e.currentTarget);
    setView((v) => zoomAt(v, Math.exp(-e.deltaY * 0.0015), p.x, p.y, w, h, V));
  }

  function setZoom(level: number) {
    setView((v) => zoomAt(v, (coverScale(w, h, V) * level) / v.scale, V / 2, V / 2, w, h, V));
  }

  function confirm() {
    const v = clampView(view, w, h, V);
    const sq = sourceSquare(v, V);
    // Preview pixels → original pixels.
    const k = image.width / w;
    onConfirm({ sx: sq.sx * k, sy: sq.sy * k, sw: sq.size * k, sh: sq.size * k });
  }

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Crop photo"
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-espresso"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <p className="mb-1 font-serif text-[22px] font-semibold text-cream">Move and scale</p>
      <p className="mb-5 text-[13px] text-cream/60">Drag to move · pinch to zoom</p>

      <div
        className="relative cursor-grab touch-none overflow-hidden rounded-[18px] bg-black select-none active:cursor-grabbing"
        style={{ width: V, height: V }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onWheel={onWheel}
      >
        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 origin-top-left"
          // transform only (ANIM-12); the canvas keeps its preview size and is scaled by the GPU
          style={{ width: w, height: h, transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` }}
        />
        {/* Circle guide: everything outside the circle is dimmed (huge spread shadow), gold rim. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-gold/80"
          style={{ boxShadow: '0 0 0 9999px rgb(42 36 32 / 0.55)' }}
        />
      </div>

      <div className="mt-6 flex w-full items-center gap-3 px-8" style={{ maxWidth: V + 64 }}>
        <ZoomOut size={18} className="shrink-0 text-cream/70" aria-hidden />
        <input
          type="range"
          aria-label="Zoom"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoomLevel(view, w, h, V)}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-[#C9A96E]"
        />
        <ZoomIn size={18} className="shrink-0 text-cream/70" aria-hidden />
      </div>

      <div className="mt-8 grid w-full grid-cols-2 gap-3 px-6" style={{ maxWidth: V + 48 }}>
        <button onClick={onCancel} className="rounded-full border border-cream/30 py-3 text-[15px] font-semibold text-cream">
          Cancel
        </button>
        <button onClick={confirm} className="rounded-full bg-cream py-3 text-[15px] font-semibold text-forest">
          Use photo
        </button>
      </div>
    </motion.div>,
    document.body,
  );
}
