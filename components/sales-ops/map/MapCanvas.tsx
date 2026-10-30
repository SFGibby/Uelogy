'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { geoIdentity, geoPath, geoAlbersUsa } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import type { Topology, GeometryCollection as TopoGC } from 'topojson-specification';
import GlowLayer, { type GlowTransform } from './GlowLayer';
import type { Agg, FilterState, Zip3Meta } from './types';
import { getAgg, installCount, pickMetric, warmColor } from './heat';
import { useUsTopo, useZip3Topo } from './useMapData';

const VIEW_W = 975;
const VIEW_H = 610;

// Gibson palette.
const INK = '#0D1023';
const SUN = '#FAD646';
const OUTLINE_ACTIVE = 'rgba(205,215,235,0.55)';
const OUTLINE_HOVER = 'rgba(250,214,70,0.9)';
const OUTLINE_EPC_HIT = 'rgba(94,228,147,0.8)';
const LABEL = '#f5f0d6';
const LABEL_STROKE = 'rgba(13,16,35,0.65)';
const ZIP_OUTER = 'rgba(205,215,235,0.55)';
const ZIP_SERVICE_STROKE = 'rgba(250,214,70,0.85)';
const ZIP_SERVICE_STROKE_HOT = '#FFF4B5';

// Centroid-nudge table. For small NE states the label floats outside the
// state silhouette so the abbreviation stays legible.
const LABEL_ADJ: Record<string, { dx: number; dy: number }> = {
  FL: { dx: 24, dy: 10 },
  LA: { dx: 6,  dy: -4 },
  MI: { dx: 20, dy: 40 },   // sit on the lower peninsula instead of the upper
  ID: { dx: 0,  dy: 12 },
  OK: { dx: 10, dy: 4 },
  WV: { dx: 4,  dy: 6 },
  KY: { dx: 10, dy: 0 },
  TN: { dx: 10, dy: 0 },
  VA: { dx: 4,  dy: 2 },
  NC: { dx: 4,  dy: 2 },
  NY: { dx: -4, dy: 8 },
  // Small NE states — labels float east/south into the ocean.
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

// Always hide: states we do not service in either channel.
const NEVER_RENDER = new Set(['AK', 'HI']);

interface StateFeature extends Feature<Geometry, { abbr: string; name: string }> {}
interface Zip3Feature extends Feature<Geometry, { p: string }> {}

interface Props {
  zip3: Zip3Meta[];
  agg: Agg;
  filter: FilterState;
  onSelectState?: (abbr: string | null) => void;
}

export default function MapCanvas({ zip3, agg, filter, onSelectState }: Props) {
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

  // Operating states: any state with volume under the current channel/window.
  const operatingSet = useMemo(() => {
    const out = new Set<string>();
    for (const z of zip3) {
      const row = getAgg(agg, 'Z3', filter, z.p);
      if (installCount(row) > 0) out.add(z.st);
    }
    return out;
  }, [zip3, agg, filter]);

  // Set of states the active EPC operates in.
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

  // US states are pre-projected into viewBox pixels — identity suffices.
  const projection = useMemo(() => geoIdentity(), []);
  const path = useMemo(() => geoPath(projection), [projection]);

  // ZIP3 topo is in raw lon/lat so we need an actual projection that matches
  // the Albers USA frame the pre-projected US topo was baked in.
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

  // ZIP3 polys for the drilled state — only ones we have installs in.
  const zip3Features: Zip3Feature[] = useMemo(() => {
    if (!filter.stateAbbr || !zip3Topo) return [];
    const t = zip3Topo as Topology<Record<string, TopoGC>>;
    const obj = t.objects?.three_dig_zips;
    if (!obj) return [];
    const fc = feature(t, obj) as unknown as FeatureCollection<Geometry, { p: string }>;
    // Only ZIP3s in this state AND where we've actually installed something.
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
    const [r, g, b] = warmColor(Math.max(0, Math.min(1, norm)));
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.82)`;
  }

  function zipStroke(p: string): string {
    const row = getAgg(agg, 'Z3', filter, p);
    const n = installCount(row);
    // Louder outline for ZIPs with meaningful volume.
    return n >= 25 ? ZIP_SERVICE_STROKE_HOT : ZIP_SERVICE_STROKE;
  }

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
      >
        {/* State paths. Only operating states get rendered at all —
            non-operating ones leave empty space so the eye lands on where
            we actually work. */}
        <g transform={svgTransform}>
          {states.map(f => {
            const abbr = f.properties.abbr;
            const inOps = operatingSet.has(abbr);
            const isHover = hover === abbr;
            const isSelected = filter.stateAbbr === abbr;
            const epcHit = epcStateSet?.has(abbr) ?? false;
            if (!inOps && !epcHit) return null;

            // The drilled state becomes a soft container outline — the ZIP
            // choropleth drawn above carries the data.
            if (filter.stateAbbr && isSelected) {
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

            const stroke = isHover || isSelected
              ? OUTLINE_HOVER
              : epcHit
                ? OUTLINE_EPC_HIT
                : OUTLINE_ACTIVE;
            const strokeW = (isHover || isSelected || epcHit ? 1.4 : 0.8) / transform.k;

            return (
              <path
                key={abbr}
                d={path(f) ?? undefined}
                fill="transparent"
                stroke={stroke}
                strokeWidth={strokeW}
                style={{ cursor: onSelectState ? 'pointer' : 'default' }}
                onMouseEnter={() => setHover(abbr)}
                onMouseLeave={() => setHover(h => (h === abbr ? null : h))}
                onClick={() => onSelectState?.(isSelected ? null : abbr)}
              >
                <title>{f.properties.name}</title>
              </path>
            );
          })}
        </g>

        {/* ZIP3 "big chunks" we service, drawn on top of the drilled state. */}
        {filter.stateAbbr && (
          <g transform={svgTransform}>
            {zip3Features.map(f => (
              <path
                key={f.properties.p}
                d={zipPath(f) ?? undefined}
                fill={zipFill(f.properties.p)}
                stroke={zipStroke(f.properties.p)}
                strokeWidth={1.1 / transform.k}
                strokeLinejoin="round"
              >
                <title>{`${f.properties.p}xx`}</title>
              </path>
            ))}
          </g>
        )}

        {/* State abbreviation labels — only for operating states, with
            offsets so small NE states stay readable. */}
        <g transform={svgTransform}>
          {states.map(f => {
            const abbr = f.properties.abbr;
            if (!operatingSet.has(abbr)) return null;
            if (filter.stateAbbr && filter.stateAbbr !== abbr) return null;
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
                  fontSize: 10 / transform.k,
                  letterSpacing: '0.14em',
                  fill: LABEL,
                  stroke: LABEL_STROKE,
                  strokeWidth: 1.2 / transform.k,
                  paintOrder: 'stroke',
                  textTransform: 'uppercase',
                }}
              >
                {abbr}
              </text>
            );
          })}
        </g>
      </svg>

      <GlowLayer zip3={zip3} agg={agg} filter={filter} width={size.w} height={size.h} transform={transform} />

      {filter.stateAbbr && (
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
          }}
          onClick={() => onSelectState?.(null)}
        >
          {filter.stateAbbr} {'\u2715'}
        </div>
      )}
    </div>
  );
}
