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
