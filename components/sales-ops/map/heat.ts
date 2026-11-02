// Heat scale, kernel density, and glow coloring for the Sales Ops map.
// Keep math out of the React components so it stays testable and fast.

import type { AggValue, Agg, Channel, FilterState, MetricKey } from './types';
import { METRIC_INDEX, MIN } from './types';

export function aggKey(sec: 'S' | 'Z3' | 'Z5', win: string, ch: Channel, inc: number, k: string, epc = ''): string {
  return [sec, win, ch, inc, k, epc].join('|');
}

export function getAgg(agg: Agg, sec: 'S' | 'Z3' | 'Z5', filter: FilterState, k: string): AggValue | null {
  const inc = filter.channel === 'E' ? filter.inc : 0;
  const key = aggKey(sec, filter.window, filter.channel, inc, k);
  return agg[key] ?? null;
}

export function pickMetric(row: AggValue | null, metric: MetricKey): number | null {
  if (!row) return null;
  const idx = METRIC_INDEX[metric];
  const v = row[idx];
  return v == null ? null : v;
}

export function installCount(row: AggValue | null): number {
  if (!row) return 0;
  return (row[0] ?? 0) as number;
}

// Warm navy \u2192 amber \u2192 yellow gradient (board A palette).
// Softer top end so blobs read as glow instead of hard yellow spots.
const GRADIENT: Array<[number, [number, number, number]]> = [
  [0.00, [10, 14, 32]],
  [0.10, [50, 25, 25]],
  [0.28, [130, 55, 28]],
  [0.48, [195, 108, 40]],
  [0.70, [230, 160, 60]],
  [0.90, [242, 198, 92]],
  [1.00, [248, 222, 128]],
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function warmColor(v: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, v));
  for (let i = 1; i < GRADIENT.length; i++) {
    if (clamped <= GRADIENT[i][0]) {
      const [t0, c0] = GRADIENT[i - 1];
      const [t1, c1] = GRADIENT[i];
      const u = (clamped - t0) / (t1 - t0 || 1);
      return [lerp(c0[0], c1[0], u), lerp(c0[1], c1[1], u), lerp(c0[2], c1[2], u)];
    }
  }
  return GRADIENT[GRADIENT.length - 1][1];
}

// Speed ramp — orange (slow) → yellow (middle) → green (fast). Used on the
// ZIP3 choropleth at drill level where speed should read at a glance.
const SPEED_GRADIENT: Array<[number, [number, number, number]]> = [
  [0.00, [255, 112, 70]],    // orange — slowest
  [0.35, [255, 160, 70]],    // amber
  [0.55, [250, 214, 70]],    // SunPower yellow
  [0.75, [168, 220, 90]],    // lime
  [1.00, [94, 228, 147]],    // green — fastest
];

export function speedColor(v: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, v));
  for (let i = 1; i < SPEED_GRADIENT.length; i++) {
    if (clamped <= SPEED_GRADIENT[i][0]) {
      const [t0, c0] = SPEED_GRADIENT[i - 1];
      const [t1, c1] = SPEED_GRADIENT[i];
      const u = (clamped - t0) / (t1 - t0 || 1);
      return [lerp(c0[0], c1[0], u), lerp(c0[1], c1[1], u), lerp(c0[2], c1[2], u)];
    }
  }
  return SPEED_GRADIENT[SPEED_GRADIENT.length - 1][1];
}

export interface DensityPoint {
  x: number;    // projected pixel x in the SVG viewBox
  y: number;    // projected pixel y
  weight: number;
}

// Build a density grid at half resolution and splat a Gaussian kernel per
// point. Returns a Uint8ClampedArray RGBA buffer sized W \u00d7 H ready for
// putImageData, where W and H are the output canvas dimensions.
export function renderDensity(
  points: DensityPoint[],
  W: number,
  H: number,
  sigma: number,
): Uint8ClampedArray {
  const r = Math.ceil(sigma * 3);
  const kSize = 2 * r + 1;
  const kernel = new Float32Array(kSize * kSize);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      kernel[(dy + r) * kSize + (dx + r)] = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
    }
  }

  const grid = new Float32Array(W * H);
  let gmax = 0;

  for (const p of points) {
    const cx = Math.round(p.x);
    const cy = Math.round(p.y);
    const w = p.weight;
    if (w <= 0) continue;
    for (let dy = -r; dy <= r; dy++) {
      const yy = cy + dy;
      if (yy < 0 || yy >= H) continue;
      const rowK = (dy + r) * kSize;
      const rowG = yy * W;
      for (let dx = -r; dx <= r; dx++) {
        const xx = cx + dx;
        if (xx < 0 || xx >= W) continue;
        const v = grid[rowG + xx] + w * kernel[rowK + (dx + r)];
        grid[rowG + xx] = v;
        if (v > gmax) gmax = v;
      }
    }
  }

  const img = new Uint8ClampedArray(W * H * 4);
  if (gmax === 0) return img;
  // Steeper gamma + higher alpha pushes peaks hotter so dense cities
  // read as distinct bright spots instead of a flat warm wash.
  const GAMMA = 1.15;
  const ALPHA_CEIL = 0.95;
  for (let i = 0; i < W * H; i++) {
    const n = grid[i] / gmax;
    const g = Math.pow(n, GAMMA);
    if (g < 0.012) continue;
    const [r2, g2, b2] = warmColor(g);
    const o = i * 4;
    img[o]     = r2;
    img[o + 1] = g2;
    img[o + 2] = b2;
    img[o + 3] = Math.round(Math.min(ALPHA_CEIL, g) * 255);
  }
  return img;
}

export { MIN };
