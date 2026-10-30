'use client';

import { useEffect, useRef } from 'react';
import { geoAlbersUsa } from 'd3-geo';
import type { Agg, FilterState, Zip3Meta } from './types';
import { getAgg, installCount, renderDensity, type DensityPoint } from './heat';

const VIEW_W = 975;
const VIEW_H = 610;
const SCALE = 0.5;    // half-res grid for perf
const SIGMA = 22;     // viewBox px

interface Props {
  zip3: Zip3Meta[];
  agg: Agg;
  filter: FilterState;
  width: number;      // CSS pixel size (reactive for mobile)
  height: number;
}

export default function GlowLayer({ zip3, agg, filter, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = Math.max(1, Math.floor(VIEW_W * SCALE));
    const H = Math.max(1, Math.floor(VIEW_H * SCALE));
    canvas.width = W;
    canvas.height = H;

    const projection = geoAlbersUsa().scale(1300).translate([VIEW_W / 2, VIEW_H / 2]);

    const points: DensityPoint[] = [];
    for (const z of zip3) {
      if (!z.lat || !z.lon) continue;
      // Skip ZIPs outside the current drill scope.
      if (filter.stateAbbr && z.st !== filter.stateAbbr) continue;
      const row = getAgg(agg, 'Z3', filter, z.p);
      const count = installCount(row);
      if (count <= 0) continue;
      const p = projection([z.lon, z.lat]);
      if (!p) continue;
      points.push({ x: p[0] * SCALE, y: p[1] * SCALE, weight: Math.sqrt(count) });
    }

    const img = renderDensity(points, W, H, SIGMA * SCALE);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const data = ctx.createImageData(W, H);
    data.data.set(img);
    ctx.putImageData(data, 0, 0);
  }, [zip3, agg, filter]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width,
        height,
        pointerEvents: 'none',
        mixBlendMode: 'plus-lighter',
      }}
      aria-hidden
    />
  );
}
