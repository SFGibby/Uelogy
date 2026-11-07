'use client';

import { useEffect, useState } from 'react';
import type { MapData, UtilityRates, FinanciersFile, BlitzFile } from './types';
import { buildEpcIndexes } from './types';

// Single-flight loader for /sales-ops/data/map-data.json. Cached at the module
// level so navigating away and back doesn't re-fetch. Index building happens
// once right after parse so TopCycles can lookup "fastest EPC in state" in
// O(1) instead of scanning the full AGG per row.

let cached: MapData | null = null;
let inFlight: Promise<MapData> | null = null;

async function load(): Promise<MapData> {
  if (cached) return cached;
  if (inFlight) return inFlight;
  inFlight = fetch('/sales-ops/data/map-data.json', { cache: 'force-cache' })
    .then(r => {
      if (!r.ok) throw new Error(`map-data.json ${r.status}`);
      return r.json();
    })
    .then((raw: Omit<MapData, 'esIndex' | 'ezIndex'>) => {
      const { esIndex, ezIndex } = buildEpcIndexes(raw.AGG);
      const d: MapData = { ...raw, esIndex, ezIndex };
      cached = d;
      inFlight = null;
      return d;
    });
  return inFlight;
}

export function useMapData() {
  const [data, setData] = useState<MapData | null>(cached);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (cached) { setData(cached); return; }
    let alive = true;
    load().then(d => { if (alive) setData(d); }).catch(e => { if (alive) setErr(String(e)); });
    return () => { alive = false; };
  }, []);

  return { data, loading: !data && !err, error: err };
}

// Same single-flight pattern for the US topology.
let topoCached: unknown = null;
let topoInFlight: Promise<unknown> | null = null;

export async function loadUsTopo(): Promise<unknown> {
  if (topoCached) return topoCached;
  if (topoInFlight) return topoInFlight;
  topoInFlight = fetch('/sales-ops/data/us-topo.json', { cache: 'force-cache' })
    .then(r => r.json())
    .then(d => { topoCached = d; topoInFlight = null; return d; });
  return topoInFlight;
}

export function useUsTopo() {
  const [topo, setTopo] = useState<unknown>(topoCached);
  useEffect(() => {
    if (topoCached) { setTopo(topoCached); return; }
    let alive = true;
    loadUsTopo().then(t => { if (alive) setTopo(t); });
    return () => { alive = false; };
  }, []);
  return topo;
}

// Enerflo installer markets — Sam's live Direct open-area set. Each market is
// `{state, metro, zone (0|1|2), zips}`. We expose both a flat state set and a
// ZIP5 → {state, metro, zone} lookup.
export interface EnerfloMarket {
  metro: string;
  zone: number;
  zips: string[];
  id: string;
}
export interface EnerfloMarkets {
  updatedAt: string;
  totalMarkets: number;
  totalZips: number;
  byState: Record<string, EnerfloMarket[]>;
}
export interface EnerfloCoverage {
  states: Set<string>;
  zipLookup: Map<string, { state: string; metro: string; zone: number }>;
  markets: EnerfloMarkets;
}

let enerfloCached: EnerfloCoverage | null = null;
let enerfloInFlight: Promise<EnerfloCoverage> | null = null;

export function useEnerfloCoverage(): EnerfloCoverage | null {
  const [cov, setCov] = useState<EnerfloCoverage | null>(enerfloCached);
  useEffect(() => {
    if (enerfloCached) { setCov(enerfloCached); return; }
    if (!enerfloInFlight) {
      enerfloInFlight = fetch('/sales-ops/data/enerflo-markets.json', { cache: 'force-cache' })
        .then(r => r.ok ? r.json() : { byState: {} })
        .then((d: EnerfloMarkets) => {
          const states = new Set(Object.keys(d.byState ?? {}));
          const zipLookup = new Map<string, { state: string; metro: string; zone: number }>();
          for (const [state, markets] of Object.entries(d.byState ?? {})) {
            for (const m of markets) {
              for (const z of m.zips) zipLookup.set(z, { state, metro: m.metro, zone: m.zone });
            }
          }
          const c = { states, zipLookup, markets: d };
          enerfloCached = c;
          enerfloInFlight = null;
          return c;
        })
        .catch(() => {
          const c = { states: new Set<string>(), zipLookup: new Map(), markets: { updatedAt: '', totalMarkets: 0, totalZips: 0, byState: {} } };
          enerfloCached = c;
          enerfloInFlight = null;
          return c;
        });
    }
    let alive = true;
    enerfloInFlight.then(c => { if (alive) setCov(c); });
    return () => { alive = false; };
  }, []);
  return cov;
}

// Serviceable states — union of all financier Active States columns.
// Kept for EPC fallback; Direct now uses Enerflo markets instead.
let serviceableCached: Set<string> | null = null;
let serviceableInFlight: Promise<Set<string>> | null = null;

export function useServiceableStates(): Set<string> | null {
  const [set, setSet] = useState<Set<string> | null>(serviceableCached);
  useEffect(() => {
    if (serviceableCached) { setSet(serviceableCached); return; }
    if (!serviceableInFlight) {
      serviceableInFlight = fetch('/sales-ops/data/serviceable-states.json', { cache: 'force-cache' })
        .then(r => r.ok ? r.json() : { states: [] })
        .then((d: { states: string[] }) => {
          const s = new Set(d.states ?? []);
          serviceableCached = s;
          serviceableInFlight = null;
          return s;
        })
        .catch(() => {
          const s = new Set<string>();
          serviceableCached = s;
          serviceableInFlight = null;
          return s;
        });
    }
    let alive = true;
    serviceableInFlight.then(s => { if (alive) setSet(s); });
    return () => { alive = false; };
  }, []);
  return set;
}

// Utility rates by state. Small (~1 KB) so we load eagerly and cache.
let utilityCached: UtilityRates | null = null;
let utilityInFlight: Promise<UtilityRates | null> | null = null;

export function useUtilityRates(): UtilityRates | null {
  const [data, setData] = useState<UtilityRates | null>(utilityCached);
  useEffect(() => {
    if (utilityCached) { setData(utilityCached); return; }
    if (!utilityInFlight) {
      utilityInFlight = fetch('/sales-ops/data/utility-rates.json', { cache: 'force-cache' })
        .then(r => r.ok ? r.json() : null)
        .then((d: UtilityRates | null) => { utilityCached = d; utilityInFlight = null; return d; })
        .catch(() => { utilityInFlight = null; return null; });
    }
    let alive = true;
    utilityInFlight.then(d => { if (alive) setData(d); });
    return () => { alive = false; };
  }, []);
  return data;
}

// Financiers derived from the resources.json Finance tab.
let financiersCached: FinanciersFile | null = null;
let financiersInFlight: Promise<FinanciersFile | null> | null = null;

export function useFinanciers(): FinanciersFile | null {
  const [data, setData] = useState<FinanciersFile | null>(financiersCached);
  useEffect(() => {
    if (financiersCached) { setData(financiersCached); return; }
    if (!financiersInFlight) {
      financiersInFlight = fetch('/sales-ops/data/financiers.json', { cache: 'force-cache' })
        .then(r => r.ok ? r.json() : null)
        .then((d: FinanciersFile | null) => { financiersCached = d; financiersInFlight = null; return d; })
        .catch(() => { financiersInFlight = null; return null; });
    }
    let alive = true;
    financiersInFlight.then(d => { if (alive) setData(d); });
    return () => { alive = false; };
  }, []);
  return data;
}

// Blitz entries — seed data for now, Colten's writes will replace once wired.
let blitzCached: BlitzFile | null = null;
let blitzInFlight: Promise<BlitzFile | null> | null = null;

export function useBlitzes(): BlitzFile | null {
  const [data, setData] = useState<BlitzFile | null>(blitzCached);
  useEffect(() => {
    if (blitzCached) { setData(blitzCached); return; }
    if (!blitzInFlight) {
      blitzInFlight = fetch('/sales-ops/data/blitzes.json', { cache: 'no-cache' })
        .then(r => r.ok ? r.json() : null)
        .then((d: BlitzFile | null) => { blitzCached = d; blitzInFlight = null; return d; })
        .catch(() => { blitzInFlight = null; return null; });
    }
    let alive = true;
    blitzInFlight.then(d => { if (alive) setData(d); });
    return () => { alive = false; };
  }, []);
  return data;
}

// Real state outlines in lon/lat, used to clip ZIP3 polygons to the drilled
// state. Some ZIP3 prefixes (per US Census ZCTA data) extend past state lines;
// without this clip, those polygons bleed into neighbor states. ~114 KB.
let statesLonLatCached: unknown = null;
let statesLonLatInFlight: Promise<unknown> | null = null;

export function useUsStatesLonLat(enabled: boolean): unknown {
  const [topo, setTopo] = useState<unknown>(statesLonLatCached);
  useEffect(() => {
    if (!enabled) return;
    if (statesLonLatCached) { setTopo(statesLonLatCached); return; }
    if (!statesLonLatInFlight) {
      statesLonLatInFlight = fetch('/sales-ops/data/us-states-lonlat.json', { cache: 'force-cache' })
        .then(r => r.ok ? r.json() : null)
        .then(d => { statesLonLatCached = d; statesLonLatInFlight = null; return d; })
        .catch(() => { statesLonLatInFlight = null; return null; });
    }
    let alive = true;
    statesLonLatInFlight.then(t => { if (alive) setTopo(t); });
    return () => { alive = false; };
  }, [enabled]);
  return topo;
}

// ZIP3 topology — lazy loaded the first time a state is drilled.
let zip3TopoCached: unknown = null;
let zip3TopoInFlight: Promise<unknown> | null = null;

export function useZip3Topo(enabled: boolean) {
  const [topo, setTopo] = useState<unknown>(zip3TopoCached);
  useEffect(() => {
    if (!enabled) return;
    if (zip3TopoCached) { setTopo(zip3TopoCached); return; }
    if (!zip3TopoInFlight) {
      zip3TopoInFlight = fetch('/sales-ops/data/zip3-topo.json', { cache: 'force-cache' })
        .then(r => r.json())
        .then(d => { zip3TopoCached = d; zip3TopoInFlight = null; return d; });
    }
    let alive = true;
    zip3TopoInFlight.then(t => { if (alive) setTopo(t); });
    return () => { alive = false; };
  }, [enabled]);
  return topo;
}

// ZIP5 (ZCTA) topology — split into 5 regional files by first digit pair.
// Only load the file that matches the drilled ZIP3's first digit.
const zcta5Cache: Record<string, unknown> = {};
const zcta5InFlight: Record<string, Promise<unknown> | undefined> = {};

export function zcta5FileFor(zip3: string | null | undefined): string | null {
  if (!zip3) return null;
  const d = zip3.charAt(0);
  if (d === '0' || d === '1') return '01';
  if (d === '2' || d === '3') return '23';
  if (d === '4' || d === '5') return '45';
  if (d === '6' || d === '7') return '67';
  if (d === '8' || d === '9') return '89';
  return null;
}

export function useZip5Topo(zip3: string | null): unknown {
  const file = zcta5FileFor(zip3);
  const [topo, setTopo] = useState<unknown>(file ? (zcta5Cache[file] ?? null) : null);
  useEffect(() => {
    if (!file) { setTopo(null); return; }
    if (zcta5Cache[file]) { setTopo(zcta5Cache[file]); return; }
    if (!zcta5InFlight[file]) {
      zcta5InFlight[file] = fetch(`/sales-ops/data/zcta/${file}.json`, { cache: 'force-cache' })
        .then(r => r.json())
        .then(d => { zcta5Cache[file] = d; zcta5InFlight[file] = undefined; return d; });
    }
    let alive = true;
    zcta5InFlight[file]!.then(t => { if (alive) setTopo(t); });
    return () => { alive = false; };
  }, [file]);
  return topo;
}
