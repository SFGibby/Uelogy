// Shared types for the Sales Ops map.
// Mirrors the aggregates and metadata exported by scripts/extract-map-data.mjs.

export type Channel = 'D' | 'E';
export type WindowKey = '3' | '6' | '12';
export type MetricKey = 'med' | 'bf' | 'fp' | 'ps' | 'sp' | 'bp' | 'n';
export type Level = 'US' | 'STATE' | 'ZIP3';

// AGG rows are indexed by "sec|win|ch|inc|k|epc" and the value is a mixed
// array. Index 0 is the install count; other indices map to metrics via
// METRIC_INDEX below.
export type AggValue = Array<number | null>;
export type Agg = Record<string, AggValue>;

export interface Zip3Meta {
  p: string;         // ZIP3 code, e.g. "005"
  st: string;        // state abbreviation
  n: number;         // install count for this ZIP3 (all-time, both channels)
  lat: number;
  lon: number;
  city: string;
}

export interface DqEntry {
  z: string;
  st: string;
  r: string;
}

export interface Meta {
  as_of: string;
  src: string;
  inactive_list: string;
}

// EPC-side index: (section|window|inc|scopeKey) -> list of (epc, row) tuples.
// Precomputed once at load so bestEpcIn() doesn't scan 50K AGG keys per row.
export interface EpcIndexRow { epc: string; row: AggValue; }
export type EpcIndex = Map<string, EpcIndexRow[]>;

export interface MapData {
  META: Meta;
  DQ: DqEntry[];
  ZIP3: Zip3Meta[];
  AGG: Agg;
  esIndex: EpcIndex;   // 'ES' keys grouped by `${window}|${inc}|${state}`
  ezIndex: EpcIndex;   // 'EZ' keys grouped by `${window}|${inc}|${zip3}`
}

export function buildEpcIndexes(agg: Agg): { esIndex: EpcIndex; ezIndex: EpcIndex } {
  const esIndex: EpcIndex = new Map();
  const ezIndex: EpcIndex = new Map();
  for (const key of Object.keys(agg)) {
    const parts = key.split('|');
    const sec = parts[0];
    if (sec !== 'ES' && sec !== 'EZ') continue;
    const epc = parts[5];
    if (!epc) continue;
    const bucket = sec === 'ES' ? esIndex : ezIndex;
    const indexKey = `${parts[1]}|${parts[3]}|${parts[4]}`;
    const arr = bucket.get(indexKey) ?? [];
    arr.push({ epc, row: agg[key] });
    bucket.set(indexKey, arr);
  }
  return { esIndex, ezIndex };
}

// Column index inside an AGG value for each metric.
// Mirrors the MI table in Ben's install-speed tool.
export const METRIC_INDEX: Record<MetricKey, number> = {
  med: 1,  // Booking \u2192 install (days)
  bf:  2,  // Booking \u2192 design
  fp:  3,  // Design \u2192 permit approved
  ps:  4,  // Permit \u2192 install
  sp:  5,  // Install \u2192 PTO
  bp:  6,  // Booking \u2192 PTO
  n:   0,  // volume (count)
};

export const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'med', label: 'Booking \u2192 install' },
  { key: 'bf',  label: 'Booking \u2192 design' },
  { key: 'fp',  label: 'Design \u2192 permit' },
  { key: 'ps',  label: 'Permit \u2192 install' },
  { key: 'sp',  label: 'Install \u2192 PTO' },
  { key: 'bp',  label: 'Booking \u2192 PTO' },
  { key: 'n',   label: 'Install volume' },
];

export const WINDOWS: { key: WindowKey; label: string }[] = [
  { key: '3',  label: '3 mo' },
  { key: '6',  label: '6 mo' },
  { key: '12', label: '1 yr' },
];

export const MIN = { S: 10, Z3: 10, Z5: 5 };

export type StateShadingKey = 'metric' | 'rate';

export interface FilterState {
  channel: Channel;
  window: WindowKey;
  metric: MetricKey;
  inc: 0 | 1;      // include inactive EPCs (only matters when channel === 'E')
  dq: boolean;     // mark ZIPs not serviced by SPWR
  level: Level;
  stateAbbr: string | null;   // when drilled into a state
  zip3: string | null;        // when drilled into a ZIP3
  activeEpc: string | null;   // EPC name when a specific EPC is isolated
  query: string;
  // National-level state shading mode:
  //   'metric'     — color by the selected install metric (current behavior)
  //   'rate'       — 4-band blue ramp by residential ¢/kWh
  stateShading: StateShadingKey;
  // Financier filter — when set to a financier.key, states without that
  // lender render dim/greyed. Independent from the shading mode.
  financierFilter: string | null;
}

export interface UtilityRates {
  updatedAt: string;
  period: string;
  us_avg: number;
  bands: Array<[number, number, string]>;   // [min, max, label]
  source: string;
  rates: Record<string, number>;
}

export interface Financier {
  key: string;
  name: string;
  states: string[];
}

export interface FinanciersFile {
  updatedAt: string;
  source: string;
  financiers: Financier[];
}
