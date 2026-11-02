'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { geoIdentity, geoPath, geoAlbersUsa } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import type { Topology, GeometryCollection as TopoGC } from 'topojson-specification';
import GlowLayer, { type GlowTransform } from './GlowLayer';
import type { Agg, FilterState, Zip3Meta } from './types';
import { getAgg, installCount, pickMetric, speedColor } from './heat';
import { useUsTopo, useZip3Topo } from './useMapData';
import { MAJOR_CITIES } from './cities';

const VIEW_W = 975;
const VIEW_H = 610;

// Gibson palette.
const INK = '#0D1023';
const SUN = '#FAD646';
const OUTLINE_ACTIVE = 'rgba(205,215,235,0.55)';
const OUTLINE_INACTIVE = 'rgba(205,215,235,0.11)';   // non-service states at US level
const OUTLINE_DRILLED_OTHER = 'rgba(205,215,235,0.06)'; // every other state while drilled
const OUTLINE_HOVER = 'rgba(250,214,70,0.9)';
const OUTLINE_EPC_HIT = 'rgba(94,228,147,0.8)';
const LABEL = '#f5f0d6';
const LABEL_STROKE = 'rgba(13,16,35,0.65)';
const ZIP_OUTER = 'rgba(205,215,235,0.55)';
const ZIP_STROKE = 'rgba(13,16,35,0.75)';            // inter-ZIP divider
const ZIP_STROKE_HOVER = SUN;

const LABEL_ADJ: Record<string, { dx: number; dy: number }> = {
  FL: { dx: 24, dy: 10 },
  LA: { dx: 6,  dy: -4 },
  MI: { dx: 20, dy: 40 },
  ID: { dx: 0,  dy: 12 },
  OK: { dx: 10, dy: 4 },
  WV: { dx: 4,  dy: 6 },
  KY: { dx: 10, dy: 0 },
  TN: { dx: 10, dy: 0 },
  VA: { dx: 4,  dy: 2 },
  NC: { dx: 4,  dy: 2 },
  NY: { dx: -4, dy: 8 },
  CT: { dx: 24, dy: 10 },
  RI: { dx: 28, dy: 2 },
  MA: { dx: 32, dy: -2 },
  NH: { dx: 20, dy: -6 },
  VT: { dx: -20, dy: -4 },
  NJ: { dx: 24, dy: 10 },
  DE: { dx: 20, dy: 10 },
  MD: { dx: 10, dy: 24 },
  DC: { dx: 22, dy: 28 },
};

const NEVER_RENDER = new Set(['AK', 'HI']);

interface StateFeature extends Feature<Geometry, { abbr: string; name: string }> {}
interface Zip3Feature extends Feature<Geometry, { p: string }> {}

interface Props {
  zip3: Zip3Meta[];
  agg: Agg;
  filter: FilterState;
  onSelectState?: (abbr: string | null) => void;
  hoverZip: string | null;
  onHoverZip: (p: string | null) => void;
}

export default function MapCanvas({ zip3, agg, filter, onSelectState, hoverZip, onHoverZip }: Props) {
  const topo = useUsTopo();
  const zip3Topo = useZip3Topo(!!filter.stateAbbr);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: VIEW_W, h: VIEW_H });
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = e.contentRect.width;
        const h = w * (VIEW_H / VIEW_W);
        setSize({ w, h });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const states: StateFeature[] = useMemo(() => {
    if (!topo) return [];
    const t = topo as Topology<{ states?: TopoGC }>;
    const obj = t.objects?.states;
    if (!obj) return [];
    const fc = feature(t, obj) as unknown as FeatureCollection<Geometry, { abbr: string; name: string }>;
    return fc.features.filter(f => !NEVER_RENDER.has(f.properties.abbr));
  }, [topo]);

  const operatingSet = useMemo(() => {
    const out = new Set<string>();
    for (const z of zip3) {
      const row = getAgg(agg, 'Z3', filter, z.p);
      if (installCount(row) > 0) out.add(z.st);
    }
    return out;
  }, [zip3, agg, filter]);

  const epcStateSet = useMemo(() => {
    if (!filter.activeEpc) return null;
    const inc = filter.inc;
    const prefix = `ES|${filter.window}|E|${inc}|`;
    const out = new Set<string>();
    for (const key of Object.keys(agg)) {
      if (!key.startsWith(prefix)) continue;
      const parts = key.split('|');
      if (parts[5] === filter.activeEpc && installCount(agg[key]) > 0) out.add(parts[4]);
    }
    return out;
  }, [agg, filter.activeEpc, filter.window, filter.inc]);

  const projection = useMemo(() => geoIdentity(), []);
  const path = useMemo(() => geoPath(projection), [projection]);

  const zipProjection = useMemo(() => geoAlbersUsa().scale(1300).translate([VIEW_W / 2, VIEW_H / 2]), []);
  const zipPath = useMemo(() => geoPath(zipProjection), [zipProjection]);

  const transform = useMemo<GlowTransform>(() => {
    if (!filter.stateAbbr) return { tx: 0, ty: 0, k: 1 };
    const f = states.find(s => s.properties.abbr === filter.stateAbbr);
    if (!f) return { tx: 0, ty: 0, k: 1 };
    const [[x0, y0], [x1, y1]] = path.bounds(f);
    const w = x1 - x0;
    const h = y1 - y0;
    if (w <= 0 || h <= 0) return { tx: 0, ty: 0, k: 1 };
    const pad = 0.14;
    const k = Math.min(VIEW_W / w, VIEW_H / h) * (1 - pad * 2);
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const tx = VIEW_W / 2 / k - cx;
    const ty = VIEW_H / 2 / k - cy;
    return { tx, ty, k };
  }, [filter.stateAbbr, states, path]);

  const svgTransform = transform.k === 1
    ? undefined
    : `scale(${transform.k}) translate(${transform.tx}, ${transform.ty})`;

  const zip3Features: Zip3Feature[] = useMemo(() => {
    if (!filter.stateAbbr || !zip3Topo) return [];
    const t = zip3Topo as Topology<Record<string, TopoGC>>;
    const obj = t.objects?.three_dig_zips;
    if (!obj) return [];
    const fc = feature(t, obj) as unknown as FeatureCollection<Geometry, { p: string }>;
    const activeZips = new Set<string>();
    for (const z of zip3) {
      if (z.st !== filter.stateAbbr) continue;
      const row = getAgg(agg, 'Z3', filter, z.p);
      if (installCount(row) > 0) activeZips.add(z.p);
    }
    return fc.features.filter(f => activeZips.has(f.properties.p));
  }, [zip3Topo, filter.stateAbbr, zip3, agg, filter]);

  const zipRange = useMemo(() => {
    if (!filter.stateAbbr) return { min: 0, max: 0 };
    const vals: number[] = [];
    for (const z of zip3) {
      if (z.st !== filter.stateAbbr) continue;
      const row = getAgg(agg, 'Z3', filter, z.p);
      const v = pickMetric(row, filter.metric);
      if (v != null) vals.push(v);
    }
    if (vals.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [filter.stateAbbr, filter.metric, filter.channel, filter.window, filter.inc, agg, zip3]);

  function zipFill(p: string): string {
    const row = getAgg(agg, 'Z3', filter, p);
    const v = pickMetric(row, filter.metric);
    if (v == null || zipRange.max === zipRange.min) return 'rgba(23,27,56,0.6)';
    const norm = filter.metric === 'n'
      ? (v - zipRange.min) / (zipRange.max - zipRange.min)
      : 1 - (v - zipRange.min) / (zipRange.max - zipRange.min);
    const [r, g, b] = speedColor(Math.max(0, Math.min(1, norm)));
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.85)`;
  }

  // Hovered ZIP paints last so its highlight ring stays on top.
  const sortedZips = useMemo(() => {
    if (!hoverZip) return zip3Features;
    const hit = zip3Features.find(f => f.properties.p === hoverZip);
    if (!hit) return zip3Features;
    return [...zip3Features.filter(f => f !== hit), hit];
  }, [zip3Features, hoverZip]);

  const drilled = !!filter.stateAbbr;

  // Project a city once (geoAlbersUsa in viewBox pixels), then apply the
  // current zoom transform so city dots travel with the drilled state.
  function projectCity(lat: number, lon: number): [number, number] | null {
    const p = zipProjection([lon, lat]);
    return p ? [p[0], p[1]] : null;
  }

  const visibleCities = useMemo(() => {
    if (drilled) return MAJOR_CITIES.filter(c => c.abbr === filter.stateAbbr);
    return MAJOR_CITIES.filter(c => c.scope === 'US' && operatingSet.has(c.abbr));
  }, [drilled, filter.stateAbbr, operatingSet]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', background: INK, borderRadius: 12, overflow: 'hidden' }}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width={size.w}
        height={size.h}
        role="img"
        aria-label="US install speed map"
        style={{ display: 'block', position: 'relative', zIndex: 0 }}
        onClick={() => {
          // Background click: exit drill, clear ZIP hover.
          if (drilled) onSelectState?.(null);
          onHoverZip(null);
        }}
      >
        {/* State paths */}
        <g transform={svgTransform}>
          {states.map(f => {
            const abbr = f.properties.abbr;
            const inOps = operatingSet.has(abbr);
            const isHover = hover === abbr;
            const isSelected = filter.stateAbbr === abbr;
            const epcHit = epcStateSet?.has(abbr) ?? false;

            // While drilled: focused state becomes a container outline; every
            // other state renders as a non-interactive faint shadow.
            if (drilled) {
              if (isSelected) {
                return (
                  <path
                    key={abbr}
                    d={path(f) ?? undefined}
                    fill="transparent"
                    stroke={ZIP_OUTER}
                    strokeWidth={1.4 / transform.k}
                    pointerEvents="none"
                  />
                );
              }
              return (
                <path
                  key={abbr}
                  d={path(f) ?? undefined}
                  fill="transparent"
                  stroke={OUTLINE_DRILLED_OTHER}
                  strokeWidth={0.6 / transform.k}
                  pointerEvents="none"
                />
              );
            }

            // US level: operating states clickable; non-ops dim + inert.
            if (!inOps && !epcHit) {
              return (
                <path
                  key={abbr}
                  d={path(f) ?? undefined}
                  fill="transparent"
                  stroke={OUTLINE_INACTIVE}
                  strokeWidth={0.6}
                  pointerEvents="none"
                />
              );
            }

            const stroke = isHover || isSelected
              ? OUTLINE_HOVER
              : epcHit
                ? OUTLINE_EPC_HIT
                : OUTLINE_ACTIVE;
            const strokeW = (isHover || isSelected || epcHit ? 1.4 : 0.8);

            return (
              <path
                key={abbr}
                d={path(f) ?? undefined}
                fill="transparent"
                stroke={stroke}
                strokeWidth={strokeW}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHover(abbr)}
                onMouseLeave={() => setHover(h => (h === abbr ? null : h))}
                onClick={(e) => { e.stopPropagation(); onSelectState?.(isSelected ? null : abbr); }}
              >
                <title>{f.properties.name}</title>
              </path>
            );
          })}
        </g>

        {/* ZIP3 chunks + hover-sync */}
        {drilled && (
          <g transform={svgTransform}>
            {sortedZips.map(f => {
              const p = f.properties.p;
              const isHot = hoverZip === p;
              return (
                <path
                  key={p}
                  d={zipPath(f) ?? undefined}
                  fill={zipFill(p)}
                  stroke={isHot ? ZIP_STROKE_HOVER : ZIP_STROKE}
                  strokeWidth={(isHot ? 2.2 : 1) / transform.k}
                  strokeLinejoin="round"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => onHoverZip(p)}
                  onMouseLeave={() => onHoverZip(null)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <title>{`${p}xx`}</title>
                </path>
              );
            })}
          </g>
        )}

        {/* State abbreviations — US level only */}
        {!drilled && (
          <g transform={svgTransform}>
            {states.map(f => {
              const abbr = f.properties.abbr;
              if (!operatingSet.has(abbr)) return null;
              const c = path.centroid(f);
              if (!Number.isFinite(c[0]) || !Number.isFinite(c[1])) return null;
              const adj = LABEL_ADJ[abbr] ?? { dx: 0, dy: 0 };
              return (
                <text
                  key={`label-${abbr}`}
                  x={c[0] + adj.dx}
                  y={c[1] + adj.dy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    pointerEvents: 'none',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
                    fontWeight: 600,
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    fill: LABEL,
                    stroke: LABEL_STROKE,
                    strokeWidth: 1.2,
                    paintOrder: 'stroke',
                    textTransform: 'uppercase',
                  }}
                >
                  {abbr}
                </text>
              );
            })}
          </g>
        )}

        {/* City pins + floating labels */}
        <g transform={svgTransform}>
          {visibleCities.map(c => {
            const p = projectCity(c.lat, c.lon);
            if (!p) return null;
            const [x, y] = p;
            const r = 3 / transform.k;
            const chipDx = 10 / transform.k;
            const chipDy = -10 / transform.k;
            const fontPx = Math.max(9, 11 / transform.k);
            const padX = 7 / transform.k;
            const padY = 4 / transform.k;
            const label = c.name.toUpperCase();
            const estWidth = label.length * fontPx * 0.58;
            return (
              <g key={`city-${c.name}-${c.abbr}`} pointerEvents="none">
                <circle cx={x} cy={y} r={r} fill={SUN} stroke={INK} strokeWidth={0.8 / transform.k} />
                <rect
                  x={x + chipDx}
                  y={y + chipDy - padY - fontPx * 0.6}
                  width={estWidth + padX * 2}
                  height={fontPx + padY * 2}
                  rx={fontPx / 1.6}
                  fill="rgba(13,16,35,0.78)"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth={0.6 / transform.k}
                />
                <text
                  x={x + chipDx + padX}
                  y={y + chipDy}
                  dominantBaseline="middle"
                  style={{
                    fontFamily: 'var(--font-gibson-mono), ui-monospace, monospace',
                    fontSize: fontPx,
                    letterSpacing: '0.14em',
                    fill: '#FFFFFF',
                  }}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <GlowLayer zip3={zip3} agg={agg} filter={filter} width={size.w} height={size.h} transform={transform} />

      {drilled && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: SUN,
            color: INK,
            fontFamily: 'var(--font-gibson-mono), ui-monospace, monospace',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: '7px 12px',
            borderRadius: 999,
            cursor: 'pointer',
            zIndex: 2,
          }}
          onClick={(e) => { e.stopPropagation(); onSelectState?.(null); }}
        >
          {filter.stateAbbr} {'\u2715'}
        </div>
      )}
    </div>
  );
}
