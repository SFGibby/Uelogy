'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { geoIdentity, geoPath, geoAlbersUsa } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import type { Topology, GeometryCollection as TopoGC } from 'topojson-specification';
import GlowLayer, { type GlowTransform } from './GlowLayer';
import type { Agg, DqEntry, FilterState, Financier, UtilityRates, Zip3Meta } from './types';
import { getAgg, installCount, pickMetric, speedColor } from './heat';
import { useUsTopo, useZip3Topo, useZip5Topo, useServiceableStates, useEnerfloCoverage, useUtilityRates, useFinanciers, useUsStatesLonLat } from './useMapData';
import { MAJOR_CITIES } from './cities';
import { stateShadingFill } from './StateShading';
import { buildDqByPrefix, computeVerdict } from './Verdict';
import MapTooltip, { type TooltipContent } from './MapTooltip';

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

// FIPS → USPS abbr, for looking up a state polygon out of the lon/lat topology
// where each geometry is keyed by its two-digit FIPS id.
const FIPS_TO_ABBR: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO',
  '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI',
  '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY',
  '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
  '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
  '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD',
  '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
  '54': 'WV', '55': 'WI', '56': 'WY',
};

interface StateFeature extends Feature<Geometry, { abbr: string; name: string }> {}
interface Zip3Feature extends Feature<Geometry, { p: string }> {}

interface Props {
  zip3: Zip3Meta[];
  agg: Agg;
  dq?: DqEntry[];
  filter: FilterState;
  onSelectState?: (abbr: string | null) => void;
  onHoverState?: (abbr: string | null) => void;
  hoverZip: string | null;
  onHoverZip: (p: string | null) => void;
  onSelectZip3?: (p: string | null) => void;
}

interface Zip5Feature extends Feature<Geometry, { z: string; c: string }> {}

export default function MapCanvas({ zip3, agg, dq, filter, onSelectState, onHoverState, hoverZip, onHoverZip, onSelectZip3 }: Props) {
  const topo = useUsTopo();
  const statesLonLat = useUsStatesLonLat(!!filter.stateAbbr);
  const zip3Topo = useZip3Topo(!!filter.stateAbbr);
  const zip5Topo = useZip5Topo(filter.zip3 ?? null);
  const serviceable = useServiceableStates();
  const enerflo = useEnerfloCoverage();
  const utility = useUtilityRates();
  const financiersFile = useFinanciers();
  const financiers = financiersFile?.financiers ?? null;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: VIEW_W, h: VIEW_H });
  const [hover, setHover] = useState<string | null>(null);
  const [tip, setTip] = useState<{ content: TooltipContent; x: number; y: number } | null>(null);
  const zip3Drilled = !!filter.zip3;

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

  // Escape = drill back one level. Matches Kerstin's planner. Only fires when
  // the map is in the DOM and no modal/input owns the key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (filter.zip3) onSelectZip3?.(null);
      else if (filter.stateAbbr) onSelectState?.(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filter.zip3, filter.stateAbbr, onSelectState, onSelectZip3]);

  const states: StateFeature[] = useMemo(() => {
    if (!topo) return [];
    const t = topo as Topology<{ states?: TopoGC }>;
    const obj = t.objects?.states;
    if (!obj) return [];
    const fc = feature(t, obj) as unknown as FeatureCollection<Geometry, { abbr: string; name: string }>;
    return fc.features.filter(f => !NEVER_RENDER.has(f.properties.abbr));
  }, [topo]);

  // EPC uses the set of states that have had any EPC install in the last
  // 6 months — the Merdeka footprint reference until we build a tighter one.
  const epcActive = useMemo(() => {
    const out = new Set<string>();
    const prefix = `ES|6|E|${filter.inc}|`;
    for (const key of Object.keys(agg)) {
      if (!key.startsWith(prefix)) continue;
      if (installCount(agg[key]) <= 0) continue;
      const parts = key.split('|');
      if (parts[4]) out.add(parts[4]);
    }
    return out;
  }, [agg, filter.inc]);

  // Direct uses the Enerflo installer-markets set (states we actually sell
  // into right now, zoned 0/1/2). Fall back to the Finance guide only if the
  // Enerflo file hasn't loaded yet.
  const activeServiceSet = useMemo<Set<string> | null>(() => {
    if (filter.channel === 'E') return epcActive;
    if (enerflo && enerflo.states.size > 0) return enerflo.states;
    return serviceable;
  }, [filter.channel, epcActive, serviceable, enerflo]);

  // A state only counts as operating if it (a) has installs under the
  // current filter AND (b) sits in the channel's active service set.
  const operatingSet = useMemo(() => {
    const out = new Set<string>();
    for (const z of zip3) {
      const row = getAgg(agg, 'Z3', filter, z.p);
      if (installCount(row) > 0) out.add(z.st);
    }
    if (!activeServiceSet || activeServiceSet.size === 0) return out;
    const filtered = new Set<string>();
    for (const abbr of out) if (activeServiceSet.has(abbr)) filtered.add(abbr);
    return filtered;
  }, [zip3, agg, filter, activeServiceSet]);

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

  const dqByPrefix = useMemo(() => buildDqByPrefix(dq), [dq]);

  // National median of the "Booking → install" metric under the current
  // filter. Verdict uses this as the baseline for fast / slow comparisons.
  const companyMedian = useMemo<number | null>(() => {
    const inc = filter.channel === 'E' ? filter.inc : 0;
    const key = `T|${filter.window}|${filter.channel}|${inc}|ALL|`;
    const row = agg[key] ?? null;
    return pickMetric(row, 'med');
  }, [agg, filter.window, filter.channel, filter.inc]);

  const zip3ByP = useMemo(() => {
    const m = new Map<string, Zip3Meta>();
    for (const z of zip3) m.set(z.p, z);
    return m;
  }, [zip3]);

  // Enerflo-covered ZIP3 prefixes for the drilled state. These are active
  // Direct markets even if they have no installs under the current filter
  // window — we still want them clickable so a leader can scout them.
  const enerfloZip3Set = useMemo(() => {
    const out = new Set<string>();
    if (!filter.stateAbbr || !enerflo) return out;
    const markets = enerflo.markets.byState?.[filter.stateAbbr] ?? [];
    for (const m of markets) {
      for (const z of m.zips) out.add(String(z).slice(0, 3));
    }
    return out;
  }, [filter.stateAbbr, enerflo]);

  // ZIP3 prefixes with at least one install under the current filter.
  const installActiveZip3Set = useMemo(() => {
    const out = new Set<string>();
    if (!filter.stateAbbr) return out;
    for (const z of zip3) {
      if (z.st !== filter.stateAbbr) continue;
      const row = getAgg(agg, 'Z3', filter, z.p);
      if (installCount(row) > 0) out.add(z.p);
    }
    return out;
  }, [filter.stateAbbr, zip3, agg, filter]);

  // ZIP3 prefix → primary state abbreviation. Used to drop neighbor-state
  // ZIP3 polygons that Enerflo might otherwise pull in.
  const zip3ToState = useMemo(() => {
    const out = new Map<string, string>();
    for (const z of zip3) out.set(z.p, z.st);
    return out;
  }, [zip3]);

  // All ZIP3 polys inside the drilled state. Union of install-active plus
  // Enerflo-active prefixes so Direct markets aren't invisible just because
  // they haven't booked installs in the current window. Any ZIP3 prefix whose
  // primary state isn't the drilled one gets dropped — we don't want to show
  // a Colorado ZIP3 while drilled into Utah, even if Enerflo lets us sell it.
  const zip3Features: Zip3Feature[] = useMemo(() => {
    if (!filter.stateAbbr || !zip3Topo) return [];
    const t = zip3Topo as Topology<Record<string, TopoGC>>;
    const obj = t.objects?.three_dig_zips;
    if (!obj) return [];
    const fc = feature(t, obj) as unknown as FeatureCollection<Geometry, { p: string }>;
    const ab = filter.stateAbbr;
    return fc.features.filter(f => {
      const p = f.properties.p;
      if (zip3ToState.get(p) !== ab) return false;
      return installActiveZip3Set.has(p) || enerfloZip3Set.has(p);
    });
  }, [zip3Topo, filter.stateAbbr, installActiveZip3Set, enerfloZip3Set, zip3ToState]);

  // Exact drilled-state polygon in lon/lat, extracted from the us-states
  // topology. Used both as a clip (to trim ZIP3 polygons that cross into
  // neighboring states) and as the state-border stroke.
  const drilledStateFeature = useMemo<Feature<Geometry, { name: string }> | null>(() => {
    if (!filter.stateAbbr || !statesLonLat) return null;
    const t = statesLonLat as Topology<Record<string, TopoGC>>;
    const obj = t.objects?.states;
    if (!obj) return null;
    try {
      const fc = feature(t, obj) as unknown as FeatureCollection<Geometry, { name: string }>;
      const want = filter.stateAbbr;
      const hit = fc.features.find(f => {
        const fipsId = (f as unknown as { id?: string }).id;
        return fipsId != null && FIPS_TO_ABBR[String(fipsId).padStart(2, '0')] === want;
      });
      return hit ?? null;
    } catch {
      return null;
    }
  }, [statesLonLat, filter.stateAbbr]);

  const transformTarget = useMemo<GlowTransform>(() => {
    // ZIP3 drill — zoom into the specific ZIP3 polygon in the Albers frame.
    if (filter.zip3) {
      const z3f = zip3Features.find(z => z.properties.p === filter.zip3);
      if (z3f) {
        const [[x0, y0], [x1, y1]] = zipPath.bounds(z3f);
        const w = x1 - x0;
        const h = y1 - y0;
        if (w > 0 && h > 0) {
          const pad = 0.12;
          const k = Math.min(VIEW_W / w, VIEW_H / h) * (1 - pad * 2);
          const cx = (x0 + x1) / 2;
          const cy = (y0 + y1) / 2;
          return { tx: VIEW_W / 2 / k - cx, ty: VIEW_H / 2 / k - cy, k };
        }
      }
    }
    // State drill — center on the Albers bounds of the ZIP3 cluster so the
    // state border rendered from ZIP arcs (via mesh) stays flush with every
    // ZIP polygon underneath it. Using the viewBox-projected state bounds
    // would land in a different coordinate space and make edges mismatch.
    if (filter.stateAbbr && zip3Features.length) {
      const fc = { type: 'FeatureCollection', features: zip3Features } as FeatureCollection<Geometry, { p: string }>;
      const [[x0, y0], [x1, y1]] = zipPath.bounds(fc);
      const w = x1 - x0;
      const h = y1 - y0;
      if (w > 0 && h > 0) {
        const pad = 0.10;
        const k = Math.min(VIEW_W / w, VIEW_H / h) * (1 - pad * 2);
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        return { tx: VIEW_W / 2 / k - cx, ty: VIEW_H / 2 / k - cy, k };
      }
    }
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
  }, [filter.stateAbbr, filter.zip3, states, path, zipPath, zip3Features]);

  // Animate the transform toward its target instead of snapping. Drill-in
  // and drill-out feel like a pan/zoom rather than a hard screen swap. Uses
  // ease-out cubic over ~450ms. Cancels on consecutive filter changes so we
  // chase the newest target.
  const [transform, setTransform] = useState<GlowTransform>(transformTarget);
  const transformRef = useRef(transform);
  transformRef.current = transform;
  useEffect(() => {
    const from = transformRef.current;
    const to = transformTarget;
    if (from.tx === to.tx && from.ty === to.ty && from.k === to.k) return;
    const start = performance.now();
    const dur = 480;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = ease(t);
      const next = {
        tx: from.tx + (to.tx - from.tx) * e,
        ty: from.ty + (to.ty - from.ty) * e,
        k: from.k + (to.k - from.k) * e,
      };
      setTransform(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [transformTarget]);

  // ZIP5 geometry filtered to just the ZIPs inside the drilled ZIP3.
  const zip5Features: Zip5Feature[] = useMemo(() => {
    if (!filter.zip3 || !zip5Topo) return [];
    const t = zip5Topo as Topology<Record<string, TopoGC>>;
    const objKey = Object.keys(t.objects ?? {})[0];
    if (!objKey) return [];
    const fc = feature(t, t.objects![objKey]) as unknown as FeatureCollection<Geometry, { z: string; c: string }>;
    const prefix = filter.zip3;
    return fc.features.filter(f => (f.properties.z ?? '').startsWith(prefix));
  }, [zip5Topo, filter.zip3]);

  // Flat ZIP5 → data lookups for coloring the ZIP5 choropleth.
  const zip5Range = useMemo(() => {
    if (!filter.zip3) return { min: 0, max: 0 };
    const vals: number[] = [];
    for (const f of zip5Features) {
      const row = getAgg(agg, 'Z5', filter, f.properties.z);
      const v = pickMetric(row, filter.metric);
      if (v != null) vals.push(v);
    }
    if (vals.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [filter.zip3, filter.metric, filter.channel, filter.window, filter.inc, agg, zip5Features]);

  function zip5Fill(z: string): string {
    const row = getAgg(agg, 'Z5', filter, z);
    const v = pickMetric(row, filter.metric);
    const inEnerflo = enerflo?.zipLookup.has(z) ?? false;
    if (v == null || zip5Range.max === zip5Range.min) {
      // No install data under current filter — still show the ZIP as part of
      // the active territory if it's in Enerflo (muted gold), or a visible
      // neutral slate otherwise. Pure dark fills blend into the background.
      return inEnerflo ? 'rgba(250, 214, 70, 0.18)' : 'rgba(140, 150, 190, 0.22)';
    }
    const norm = filter.metric === 'n'
      ? (v - zip5Range.min) / (zip5Range.max - zip5Range.min)
      : 1 - (v - zip5Range.min) / (zip5Range.max - zip5Range.min);
    const [r, g, b] = speedColor(Math.max(0, Math.min(1, norm)));
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.85)`;
  }

  const svgTransform = transform.k === 1
    ? undefined
    : `scale(${transform.k}) translate(${transform.tx}, ${transform.ty})`;

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

  // Muted SunPower-yellow tint for ZIP3s that are in an Enerflo market but
  // don't have install data under the current filter. Still clickable, still
  // clearly belongs on the map, but visually distinct from the speed heat.
  const ENERFLO_IDLE_FILL = 'rgba(250, 214, 70, 0.16)';
  const EMPTY_FILL = 'rgba(23, 27, 56, 0.6)';

  function zipFill(p: string): string {
    const row = getAgg(agg, 'Z3', filter, p);
    const v = pickMetric(row, filter.metric);
    if (v == null || zipRange.max === zipRange.min) {
      return enerfloZip3Set.has(p) ? ENERFLO_IDLE_FILL : EMPTY_FILL;
    }
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

  // Cities only render once drilled into a state. Direct also layers in the
  // Product-by-Market "Sales Region" metros; EPC hides those (they are a
  // Direct go-to-market artefact) and shows the generic state metros only.
  const visibleCities = useMemo(() => {
    if (!drilled) return [];
    return MAJOR_CITIES.filter(c => {
      if (c.abbr !== filter.stateAbbr) return false;
      if (c.directOnly && filter.channel !== 'D') return false;
      return true;
    });
  }, [drilled, filter.stateAbbr, filter.channel]);

  function buildStateTooltip(abbr: string, name: string, inOps: boolean, epcHit: boolean): TooltipContent {
    const rate = utility?.rates[abbr];
    const stateLenders = financiers ? financiers.filter(f => f.states.includes(abbr)) : [];
    const lines: Array<{ label: string; value: string }> = [];
    if (rate != null) lines.push({ label: 'Utility', value: `${rate.toFixed(1)}¢ / kWh` });
    lines.push({
      label: `Lenders (${stateLenders.length})`,
      value: stateLenders.length > 0 ? stateLenders.map(f => f.name).join(', ') : 'none on file',
    });
    const financierMiss = !!(filter.financierFilter && financiers && !financiers
      .find(f => f.key === filter.financierFilter)?.states.includes(abbr));
    const footnote = financierMiss
      ? `No ${financiers?.find(f => f.key === filter.financierFilter)?.name ?? 'lender'} here`
      : inOps
        ? (filter.channel === 'E' ? 'EPC: has recent installs' : 'Direct: working area')
        : (epcHit ? 'EPC footprint, no installs in window' : 'Not serviced in this channel');
    return { title: name, lines, footnote };
  }

  function buildZip3Tooltip(p: string): TooltipContent {
    const meta = zip3ByP.get(p);
    if (!meta) return { title: `${p}xx` };
    const inEnerflo = enerfloZip3Set.has(p);
    const hasInstalls = installActiveZip3Set.has(p);
    if (!hasInstalls && inEnerflo) {
      return {
        title: `${p}xx · ${meta.city}`,
        chip: { label: 'Direct market', kind: 'good' },
        footnote: 'No install data in window — scout opportunity',
      };
    }
    const v = computeVerdict(meta, agg, filter, { companyMedian, dqByPrefix });
    const row = getAgg(agg, 'Z3', filter, p);
    const med = pickMetric(row, 'med');
    const volume = installCount(row);
    const lines: Array<{ label: string; value: string }> = [];
    if (med != null) lines.push({ label: 'Median', value: `${Math.round(med)} days` });
    if (companyMedian != null) lines.push({ label: 'Company', value: `${Math.round(companyMedian)} days` });
    lines.push({ label: 'Installs', value: `${volume.toLocaleString()}` });
    if (v.dqCount > 0) lines.push({ label: 'DQ ZIPs', value: `${v.dqCount} of ${meta.n}` });
    return {
      title: `${p}xx · ${meta.city}`,
      chip: { label: v.label, kind: v.key },
      lines,
      flags: v.flags,
    };
  }

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!tip) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ ...tip, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const openTip = (content: TooltipContent, e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ content, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleContainerMouseMove}
      onMouseLeave={() => setTip(null)}
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
          // Background click: pop one drill level.
          if (zip3Drilled) onSelectZip3?.(null);
          else if (drilled) onSelectState?.(null);
          onHoverZip(null);
        }}
      >
        <defs>
          {/* Hatched pattern for ZIP3s with disqualified ZIPs. 45° diagonal
              lines over a transparent background so the base speed fill stays
              visible underneath. */}
          <pattern id="dq-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(13,16,35,0.75)" strokeWidth="1.1" />
          </pattern>
          {/* Drilled-state silhouette in Albers coords. Used to clip ZIP3
              polygons so they never render past the real state border even
              when a ZIP3 prefix legally crosses state lines. */}
          {drilledStateFeature && (
            <clipPath id="state-clip">
              <path d={zipPath(drilledStateFeature) ?? undefined} />
            </clipPath>
          )}
        </defs>
        {/* State paths */}
        <g transform={svgTransform}>
          {states.map(f => {
            const abbr = f.properties.abbr;
            const inOps = operatingSet.has(abbr);
            const isHover = hover === abbr;
            const isSelected = filter.stateAbbr === abbr;
            const epcHit = epcStateSet?.has(abbr) ?? false;

            // While drilled: all state paths are hidden. The drilled state's
            // border is drawn separately in the Albers frame from the ZIP3
            // arc mesh so it sits flush with every ZIP edge; neighbor states
            // sit in a different projection and would only add visual noise
            // off to the side, so we skip them.
            if (drilled) return null;

            // When shading by utility rate, all states get a choropleth fill —
            // that info is geographic, not tied to whether we sell there.
            // Non-operating states stay inert (no click).
            const shadingFill = stateShadingFill({
              abbr,
              mode: filter.stateShading,
              utility,
              financiers,
              singleFinancierKey: null,
            });

            // Financier filter dims out states that don't have the picked
            // lender. Independent from shading — a dimmed state can still
            // carry a utility rate fill, just at lower opacity.
            const financierMiss = !!(filter.financierFilter && financiers && !financiers
              .find(f => f.key === filter.financierFilter)?.states.includes(abbr));
            const dimOpacity = financierMiss ? 0.22 : 1;

            // US level: operating states clickable; non-ops dim + inert.
            if (!inOps && !epcHit) {
              return (
                <path
                  key={abbr}
                  d={path(f) ?? undefined}
                  fill={shadingFill ?? 'transparent'}
                  stroke={OUTLINE_INACTIVE}
                  strokeWidth={0.6}
                  pointerEvents="none"
                  opacity={dimOpacity}
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
                fill={shadingFill ?? 'transparent'}
                stroke={stroke}
                strokeWidth={strokeW}
                opacity={dimOpacity}
                style={{ cursor: financierMiss ? 'not-allowed' : 'pointer' }}
                onMouseEnter={(e) => {
                  setHover(abbr);
                  onHoverState?.(abbr);
                  openTip(buildStateTooltip(abbr, f.properties.name, inOps, epcHit), e);
                }}
                onMouseLeave={() => {
                  setHover(h => (h === abbr ? null : h));
                  onHoverState?.(null);
                  setTip(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (financierMiss) return;
                  onSelectState?.(isSelected ? null : abbr);
                }}
              />
            );
          })}
        </g>

        {/* ZIP3 chunks + hover-sync */}
        {drilled && !zip3Drilled && (
          <g
            transform={svgTransform}
            clipPath={drilledStateFeature ? 'url(#state-clip)' : undefined}
            style={{ opacity: Math.min(1, transform.k / Math.max(1.1, transformTarget.k * 0.4)), transition: 'opacity 240ms ease-out' }}
          >
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
                  onMouseEnter={(e) => { onHoverZip(p); openTip(buildZip3Tooltip(p), e); }}
                  onMouseLeave={() => { onHoverZip(null); setTip(null); }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectZip3?.(p);
                  }}
                />
              );
            })}
            {/* Hatched DQ overlay. Opacity scales with DQ ratio per ZIP3, so
                ZIP3s with every ZIP disqualified read nearly solid, and ZIP3s
                with one or two DQs read as a faint stripe. */}
            {filter.dq && sortedZips.map(f => {
              const p = f.properties.p;
              const meta = zip3ByP.get(p);
              const dqn = dqByPrefix.get(p)?.length ?? 0;
              if (!meta || dqn === 0) return null;
              const ratio = Math.max(0.18, Math.min(0.85, dqn / Math.max(1, meta.n)));
              return (
                <path
                  key={`dq-${p}`}
                  d={zipPath(f) ?? undefined}
                  fill="url(#dq-hatch)"
                  stroke="none"
                  pointerEvents="none"
                  opacity={ratio}
                />
              );
            })}
          </g>
        )}
        {/* State border, drawn OUTSIDE the clipped group so the stroke hugs
            the clip edge on both sides. Real state silhouette in Albers. */}
        {drilled && !zip3Drilled && drilledStateFeature && (
          <g transform={svgTransform} style={{ pointerEvents: 'none' }}>
            <path
              d={zipPath(drilledStateFeature) ?? undefined}
              fill="none"
              stroke={ZIP_OUTER}
              strokeWidth={1.6 / transform.k}
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* ZIP5 polys when drilled into a ZIP3 */}
        {drilled && zip3Drilled && (
          <g transform={svgTransform} style={{ opacity: Math.min(1, transform.k / Math.max(2, transformTarget.k * 0.5)), transition: 'opacity 220ms ease-out' }}>
            {zip5Features.map(f => {
              const z = f.properties.z;
              const isHot = hoverZip === z;
              return (
                <path
                  key={z}
                  d={zipPath(f) ?? undefined}
                  fill={zip5Fill(z)}
                  stroke={isHot ? ZIP_STROKE_HOVER : ZIP_STROKE}
                  strokeWidth={(isHot ? 2.4 : 0.9) / transform.k}
                  strokeLinejoin="round"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => onHoverZip(z)}
                  onMouseLeave={() => onHoverZip(null)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <title>{`${z} \u00b7 ${f.properties.c}`}</title>
                </path>
              );
            })}
          </g>
        )}

        {/* Persistent ZIP3 labels on drill-in so a lead can plan where to go.
            Rooms-too-small ZIPs lose the dark pill and fall back to compact
            white-on-black text so neighbor labels don't crash into each other.
            Hidden at ZIP5 drill level — ZIP5 labels take over. */}
        {drilled && !zip3Drilled && (
          <g transform={svgTransform}>
            {sortedZips.map(f => {
              const p = f.properties.p;
              const c = zipPath.centroid(f);
              if (!Number.isFinite(c[0]) || !Number.isFinite(c[1])) return null;
              const b = zipPath.bounds(f);
              const polyW = b[1][0] - b[0][0];
              const polyH = b[1][1] - b[0][1];
              const k = transform.k;
              const fontPx = 11 / k;
              const pillW = fontPx * 3 * 0.68 + 6 / k;
              const pillH = fontPx + 4 / k;
              // Only draw the dark pill if it comfortably fits inside the ZIP
              // polygon's bounding box. Otherwise, drop to plain stroked text
              // so dense clusters stop stacking rectangles.
              const fitsPill = pillW < polyW * 0.82 && pillH < polyH * 0.82;
              if (fitsPill) {
                return (
                  <g key={`zl-${p}`} pointerEvents="none">
                    <rect
                      x={c[0] - pillW / 2}
                      y={c[1] - pillH / 2}
                      width={pillW}
                      height={pillH}
                      rx={pillH / 2}
                      fill="rgba(13,16,35,0.78)"
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth={0.6 / k}
                    />
                    <text
                      x={c[0]}
                      y={c[1]}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fontFamily: 'var(--font-gibson-mono), ui-monospace, monospace',
                        fontSize: fontPx,
                        letterSpacing: '0.08em',
                        fill: '#FFFFFF',
                        fontWeight: 700,
                      }}
                    >
                      {p}
                    </text>
                  </g>
                );
              }
              // Fallback compact label — no background, dark text stroked in
              // white so it reads over any choropleth fill.
              const smallFont = Math.min(fontPx, Math.max(polyW, polyH) * 0.5);
              return (
                <text
                  key={`zl-${p}`}
                  x={c[0]}
                  y={c[1]}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  pointerEvents="none"
                  style={{
                    fontFamily: 'var(--font-gibson-mono), ui-monospace, monospace',
                    fontSize: smallFont,
                    letterSpacing: '0.04em',
                    fill: '#0D1023',
                    stroke: 'rgba(255,255,255,0.75)',
                    strokeWidth: 0.9 / k,
                    paintOrder: 'stroke',
                    fontWeight: 800,
                  }}
                >
                  {p}
                </text>
              );
            })}
          </g>
        )}

        {/* ZIP5 labels (compact) at ZIP5 drill level */}
        {drilled && zip3Drilled && (
          <g transform={svgTransform}>
            {zip5Features.map(f => {
              const z = f.properties.z;
              const c = zipPath.centroid(f);
              if (!Number.isFinite(c[0]) || !Number.isFinite(c[1])) return null;
              const b = zipPath.bounds(f);
              const polyW = b[1][0] - b[0][0];
              const polyH = b[1][1] - b[0][1];
              const k = transform.k;
              const fontPx = 7 / k;
              const smallFont = Math.min(fontPx, Math.max(polyW, polyH) * 0.4);
              return (
                <text
                  key={`z5l-${z}`}
                  x={c[0]}
                  y={c[1]}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  pointerEvents="none"
                  style={{
                    fontFamily: 'var(--font-gibson-mono), ui-monospace, monospace',
                    fontSize: smallFont,
                    letterSpacing: '0.02em',
                    fill: '#0D1023',
                    stroke: 'rgba(255,255,255,0.7)',
                    strokeWidth: 0.6 / k,
                    paintOrder: 'stroke',
                    fontWeight: 700,
                  }}
                >
                  {z}
                </text>
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
            const k = transform.k;
            // Everything inside this <g> gets scaled by k on render, so to
            // land on a ~10px label on screen the SVG units need to be 10/k.
            const r = 2.6 / k;
            const chipDx = 8 / k;
            const chipDy = -8 / k;
            const fontPx = 10 / k;
            const padX = 8 / k;
            const padY = 3 / k;
            const label = c.name.toUpperCase();
            // Mono + 0.14em letter-spacing lands around 0.78 char-width ratio;
            // bump a hair past that so long names (SAN FRANCISCO, HARRISBURG)
            // don't poke out of their pill.
            const estWidth = label.length * fontPx * 0.82;
            return (
              <g key={`city-${c.name}-${c.abbr}`} pointerEvents="none">
                <circle cx={x} cy={y} r={r} fill={OUTLINE_ACTIVE} stroke={INK} strokeWidth={0.8 / k} />
                <rect
                  x={x + chipDx}
                  y={y + chipDy - padY - fontPx * 0.6}
                  width={estWidth + padX * 2}
                  height={fontPx + padY * 2}
                  rx={fontPx / 1.6}
                  fill="rgba(13,16,35,0.78)"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth={0.6 / k}
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

      {filter.stateShading === 'metric' && (
        <GlowLayer zip3={zip3} agg={agg} filter={filter} width={size.w} height={size.h} transform={transform} />
      )}

      <MapTooltip
        content={tip?.content ?? null}
        x={tip?.x ?? 0}
        y={tip?.y ?? 0}
        containerRect={containerRef.current?.getBoundingClientRect() ?? null}
      />
    </div>
  );
}
