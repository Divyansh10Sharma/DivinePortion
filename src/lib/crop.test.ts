import { describe, expect, it } from 'vitest';
import { clampView, coverScale, initialView, MAX_ZOOM, panBy, sourceSquare, zoomAt, zoomLevel } from './crop';

// A 4:3 landscape preview (1600 × 1200) in a 300 px square viewport.
const W = 1600;
const H = 1200;
const V = 300;

describe('crop maths', () => {
  it('starts covering the square, centred', () => {
    const v = initialView(W, H, V);
    expect(v.scale).toBeCloseTo(0.25); // 1200 × 0.25 = 300
    expect(v.x).toBeCloseTo(-50); // (300 − 400) / 2
    expect(v.y).toBeCloseTo(0);
    expect(sourceSquare(v, V)).toEqual({ sx: 200, sy: -0, size: 1200 });
  });

  it('never lets the image uncover the square', () => {
    const v = initialView(W, H, V);
    expect(panBy(v, 500, 500, W, H, V)).toMatchObject({ x: 0, y: 0 });
    expect(panBy(v, -500, -500, W, H, V)).toMatchObject({ x: -100, y: 0 });
    expect(clampView({ scale: 0.01, x: 0, y: 0 }, W, H, V).scale).toBeCloseTo(coverScale(W, H, V));
  });

  it('zooms around the pinch point and caps the zoom', () => {
    const v = initialView(W, H, V);
    const z = zoomAt(v, 2, 150, 150, W, H, V); // zoom 2× around the centre
    expect(z.scale).toBeCloseTo(0.5);
    // the image point under the centre stays under the centre
    const before = { x: (150 - v.x) / v.scale, y: (150 - v.y) / v.scale };
    const after = { x: (150 - z.x) / z.scale, y: (150 - z.y) / z.scale };
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
    expect(sourceSquare(z, V).size).toBeCloseTo(600);

    const maxed = zoomAt(v, 100, 0, 0, W, H, V);
    expect(zoomLevel(maxed, W, H, V)).toBeCloseTo(MAX_ZOOM);
    const outAgain = zoomAt(maxed, 0.0001, 0, 0, W, H, V);
    expect(zoomLevel(outAgain, W, H, V)).toBeCloseTo(1);
  });

  it('portrait images centre vertically', () => {
    const v = initialView(1200, 1600, V);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(-50);
  });
});
