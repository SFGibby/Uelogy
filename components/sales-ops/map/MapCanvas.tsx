'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { geoIdentity, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import type { Topology, GeometryCollection as TopoGC } from 'topojson-specification';
import GlowLayer from './GlowLayer';
import type { Agg, FilterState, Zip3Meta } from './types';
import { useUsTopo } from './useMapData';

const VIEW_W = 975;
const VIEW_H = 610;

// SunPower swagger palette.
const INK = '#0D1023';
const SUN = '#FAD646';
const OUTLINE = 'rgba(205,215,235,0.42)';
const OUTLINE_HOVER = 'rgba(250,214,70,0.9)';
const LABEL = '#f5f0d6';
const LABEL_STROKE = 'rgba(13,16,35,0.65)';

// Nudges for state abbreviations whose geometric centroid misses the eye.
const LABEL_ADJ: Record<string, { dx: number; dy: number }> = {
  FL: { dx: 24, dy: 10 },
  LA: { dx: 6,  dy: -4 },
  MI: { dx: 0,  dy: 24 },
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

interface Props {
  zip3: Zip3Meta[];
  agg: Agg;
  filter: FilterState;
  onSelectState?: (abbr: string | null) => void;
}

export default function MapCanvas({ zip3, agg, filter, onSelectState }: Props) {
  const topo = useUsTopo();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: VIEW_W, h: VIEW_H });
  const [hover, setHover] = useState<string | null>(null);

  // Watch container width and recompute SVG rendering size.
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

  // TOPO geometry is already pre-projected into the 975 \u00d7 610 viewBox
  // (bbox roughly [-57, 12, 957, ...]), so geoIdentity renders paths as-is.
  const projection = useMemo(() => geoIdentity(), []);
  const path = useMemo(() => geoPath(projection), [projection]);

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
        <g>
          {states.map(f => {
            const abbr = f.properties.abbr;
            const isHover = hover === abbr;
            const isSelected = filter.stateAbbr === abbr;
            return (
              <path
                key={abbr}
                d={path(f) ?? undefined}
                fill="transparent"
                stroke={isHover || isSelected ? OUTLINE_HOVER : OUTLINE}
                strokeWidth={isHover || isSelected ? 1.4 : 0.7}
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
        <g>
          {states.map(f => {
            const abbr = f.properties.abbr;
            if (SKIP_LABEL.has(abbr)) return null;
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
      </svg>

      <GlowLayer zip3={zip3} agg={agg} filter={filter} width={size.w} height={size.h} />

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
          {filter.stateAbbr} \u2715
        </div>
      )}
    </div>
  );
}
