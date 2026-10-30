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

export interface MapData {
  META: Meta;
  DQ: DqEntry[];
  ZIP3: Zip3Meta[];
  AGG: Agg;
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
}
