'use client';

import { useEffect, useState } from 'react';
import type { MapData } from './types';

// Single-flight loader for /sales-ops/data/map-data.json. Cached at the module
// level so navigating away and back doesn't re-fetch.

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
    .then((d: MapData) => {
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
