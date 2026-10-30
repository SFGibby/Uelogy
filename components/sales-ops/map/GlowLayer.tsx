'use client';

import { useEffect, useRef } from 'react';
import { geoAlbersUsa } from 'd3-geo';
import type { Agg, FilterState, Zip3Meta } from './types';
import { getAgg, installCount, renderDensity, type DensityPoint } from './heat';

const VIEW_W = 975;
const VIEW_H = 610;
const SCALE = 0.5;
const BASE_SIGMA = 34;          // viewBox px \u2014 bigger kernel for a softer board A look

export interface GlowTransform {
  tx: number;    // translate X in viewBox coords
  ty: number;    // translate Y in viewBox coords
  k: number;     // scale factor applied after translate
}

interface Props {
  zip3: Zip3Meta[];
  agg: Agg;
  filter: FilterState;
  width: number;
  height: number;
  transform?: GlowTransform;      // when a state is drilled, zoom the glow
}

export default function GlowLayer({ zip3, agg, filter, width, height, transform }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = Math.max(1, Math.floor(VIEW_W * SCALE));
    const H = Math.max(1, Math.floor(VIEW_H * SCALE));
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    // When drilled into a state the choropleth ZIP3 fills do the work;
    // the glow raster would just muddy the picture.
    if (filter.stateAbbr) return;

    const projection = geoAlbersUsa().scale(1300).translate([VIEW_W / 2, VIEW_H / 2]);
    const t = transform ?? { tx: 0, ty: 0, k: 1 };

    const points: DensityPoint[] = [];
    for (const z of zip3) {
      if (!z.lat || !z.lon) continue;
      const row = getAgg(agg, 'Z3', filter, z.p);
      const count = installCount(row);
      if (count <= 0) continue;
      const p = projection([z.lon, z.lat]);
      if (!p) continue;
      const px = (p[0] + t.tx) * t.k;
      const py = (p[1] + t.ty) * t.k;
      points.push({ x: px * SCALE, y: py * SCALE, weight: Math.sqrt(count) });
    }

    // Tighter kernel yields more distinct bright spots at the US view.
    const sigma = BASE_SIGMA * 0.55;
    const img = renderDensity(points, W, H, sigma * SCALE);
    const data = ctx.createImageData(W, H);
    data.data.set(img);
    ctx.putImageData(data, 0, 0);
  }, [zip3, agg, filter, transform]);

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
