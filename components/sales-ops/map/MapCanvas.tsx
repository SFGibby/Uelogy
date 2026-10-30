'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { geoIdentity, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import type { Topology, GeometryCollection as TopoGC } from 'topojson-specification';
import GlowLayer, { type GlowTransform } from './GlowLayer';
import type { Agg, FilterState, Zip3Meta } from './types';
import { getAgg, installCount, pickMetric, warmColor } from './heat';
import { useUsTopo, useZip3Topo } from './useMapData';

const VIEW_W = 975;
const VIEW_H = 610;

// SunPower swagger palette.
const INK = '#0D1023';
const SUN = '#FAD646';
const OUTLINE_ACTIVE = 'rgba(205,215,235,0.55)';   // states we operate in
const OUTLINE_DIM = 'rgba(205,215,235,0.14)';      // states we don't
const OUTLINE_HOVER = 'rgba(250,214,70,0.9)';
const OUTLINE_EPC_HIT = 'rgba(94,228,147,0.8)';    // EPC operates here
const LABEL = '#f5f0d6';
const LABEL_STROKE = 'rgba(13,16,35,0.65)';
const ZIP_STROKE = 'rgba(13,16,35,0.9)';           // inter-ZIP border
const ZIP_OUTER = 'rgba(205,215,235,0.55)';        // state outline when drilled

// Nudges for state abbreviations whose geometric centroid misses the eye.
const LABEL_ADJ: Record<string, { dx: number; dy: number }> = {
  FL: { dx: 24, dy: 10 },
  LA: { dx: 6,  dy: -4 },
  MI: { dx: 12, dy: -10 },
  ID: { dx: 0,  dy: 12 },
  MD: { dx: -14, dy: 2 },
  MA: { dx: -12, dy: 0 },
  OK: { dx: 10, dy: 4 },
  WV: { dx: 4,  dy: 6 },
  KY: { dx: 10, dy: 0 },
  TN: { dx: 10, dy: 0 },
  VA: { dx: 4,  dy: 2 },
  NC: { dx: 4,  dy: 2 },
  NY: { dx: -4, dy: 8 },
  AK: { dx: 20, dy: 0 },
  HI: { dx: 10, dy: 0 },
};

// Small NE states that get a side pop-out instead of trying to label on map.
const SKIP_LABEL = new Set(['CT','DE','MA','MD','NH','NJ','RI','VT','DC']);

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
    return fc.features;
  }, [topo]);

  // Operating states: any state with volume under the current channel/window.
  // Falls back to the ZIP3 metadata so Direct-only states still read as active.
  const operatingSet = useMemo(() => {
    const out = new Set<string>();
    for (const z of zip3) {
      const row = getAgg(agg, 'Z3', filter, z.p);
      if (installCount(row) > 0) out.add(z.st);
    }
    return out;
  }, [zip3, agg, filter]);

  // Set of states the active EPC operates in (keys of form "ES|w|E|inc|<abbr>|<epc>").
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

  // ZIP3 polys for the drilled state only.
  const zip3Features: Zip3Feature[] = useMemo(() => {
    if (!filter.stateAbbr || !zip3Topo) return [];
    const t = zip3Topo as Topology<Record<string, TopoGC>>;
    const obj = t.objects?.three_dig_zips;
    if (!obj) return [];
    const fc = feature(t, obj) as unknown as FeatureCollection<Geometry, { p: string }>;
    const inState = new Set(zip3.filter(z => z.st === filter.stateAbbr).map(z => z.p));
    return fc.features.filter(f => inState.has(f.properties.p));
  }, [zip3Topo, filter.stateAbbr, zip3]);

  // Metric range for choropleth coloring at drill level.
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
    // For time-based metrics lower is better. For volume (n) higher is better.
    const norm = filter.metric === 'n'
      ? (v - zipRange.min) / (zipRange.max - zipRange.min)
      : 1 - (v - zipRange.min) / (zipRange.max - zipRange.min);
    const [r, g, b] = warmColor(Math.max(0, Math.min(1, norm)));
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.78)`;
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
        <g transform={svgTransform}>
          {states.map(f => {
            const abbr = f.properties.abbr;
            const isHover = hover === abbr;
            const isSelected = filter.stateAbbr === abbr;
            const inOps = operatingSet.has(abbr);
            const epcHit = epcStateSet?.has(abbr) ?? false;
            const stroke = isHover || isSelected
              ? OUTLINE_HOVER
              : epcHit
                ? OUTLINE_EPC_HIT
                : inOps
                  ? OUTLINE_ACTIVE
                  : OUTLINE_DIM;
            const strokeW = (isHover || isSelected || epcHit ? 1.4 : 0.7) / transform.k;
            // Hide state polys inside the drilled state since ZIP polys take over.
            if (filter.stateAbbr && isSelected) {
              return (
                <path
                  key={abbr}
                  d={path(f) ?? undefined}
                  fill="transparent"
                  stroke={ZIP_OUTER}
                  strokeWidth={1.2 / transform.k}
                  pointerEvents="none"
                />
              );
            }
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

        {/* ZIP3 choropleth drawn only inside the drilled state */}
        {filter.stateAbbr && (
          <g transform={svgTransform}>
            {zip3Features.map(f => (
              <path
                key={f.properties.p}
                d={path(f) ?? undefined}
                fill={zipFill(f.properties.p)}
                stroke={ZIP_STROKE}
                strokeWidth={0.6 / transform.k}
              >
                <title>{f.properties.p}</title>
              </path>
            ))}
          </g>
        )}

        <g transform={svgTransform}>
          {states.map(f => {
            const abbr = f.properties.abbr;
            if (SKIP_LABEL.has(abbr)) return null;
            // Only label states we operate in.
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
            fontFamily: 'var(--font-swagger-mono), ui-monospace, monospace',
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
