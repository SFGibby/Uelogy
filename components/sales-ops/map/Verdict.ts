// Per-ZIP3 verdict — "Good to blitz" / "Use caution" / "Not serviced" —
// adapted from Kerstin's planner. Our data has install speed + DQ list but no
// per-rep crew home_zip5, so the crew coverage flags are omitted.

import type { Agg, AggValue, DqEntry, FilterState, Zip3Meta } from './types';
import { METRIC_INDEX, MIN } from './types';
import { getAgg, installCount, pickMetric } from './heat';

export type VerdictKey = 'good' | 'caution' | 'dq';

export interface VerdictFlag { k: 'good' | 'warn' | 'bad'; t: string; }

export interface Verdict {
  key: VerdictKey;
  label: string;
  flags: VerdictFlag[];
  dqCount: number;
}

const VERDICT_LABEL: Record<VerdictKey, string> = {
  good: 'Good to blitz',
  caution: 'Use caution',
  dq: 'Not serviced',
};

// Threshold for "fast" vs "slow" when compared to the company-wide median.
// 10 days below → fast market; 10 days above → slow market. Everything else
// reads as average.
const FAST_DELTA = 10;
const SLOW_DELTA = 10;

interface Options {
  companyMedian: number | null;   // national median under current filter
  dqByPrefix: Map<string, DqEntry[]>;
}

export function buildDqByPrefix(dq: DqEntry[] | undefined): Map<string, DqEntry[]> {
  const out = new Map<string, DqEntry[]>();
  if (!dq) return out;
  for (const e of dq) {
    const p = e.z.slice(0, 3);
    const list = out.get(p);
    if (list) list.push(e); else out.set(p, [e]);
  }
  return out;
}

export function computeVerdict(
  zip3Meta: Zip3Meta,
  agg: Agg,
  filter: FilterState,
  opts: Options,
): Verdict {
  const p = zip3Meta.p;
  const dqList = opts.dqByPrefix.get(p) ?? [];
  const dqn = dqList.length;
  const flags: VerdictFlag[] = [];

  const allDq = zip3Meta.n > 0 && dqn >= zip3Meta.n;
  if (allDq) {
    flags.push({ k: 'bad', t: 'Every ZIP in this area is not serviced.' });
  } else if (dqn > 0) {
    flags.push({ k: 'warn', t: `${dqn} of ${zip3Meta.n} ZIPs are not serviced here.` });
  }

  const row = getAgg(agg, 'Z3', filter, p);
  const med = pickMetric(row, 'med');
  const volume = installCount(row);
  const base = opts.companyMedian;

  if (med != null && base != null && volume >= MIN.Z3) {
    if (med <= base - FAST_DELTA) {
      flags.push({ k: 'good', t: `Fast install market: median ${Math.round(med)} days vs company ${Math.round(base)}.` });
    } else if (med >= base + SLOW_DELTA) {
      flags.push({ k: 'warn', t: `Slow install market: median ${Math.round(med)} days vs company ${Math.round(base)}.` });
    } else {
      flags.push({ k: 'good', t: `Average install speed: median ${Math.round(med)} days.` });
    }
  } else if (med != null) {
    flags.push({ k: 'good', t: `Median install ${Math.round(med)} days (small sample).` });
  } else {
    flags.push({ k: 'warn', t: 'Not enough install history for a speed read.' });
  }

  let key: VerdictKey;
  if (allDq) key = 'dq';
  else if (dqn > 0 || med == null || (base != null && med != null && med >= base + SLOW_DELTA)) key = 'caution';
  else key = 'good';

  return { key, label: VERDICT_LABEL[key], flags, dqCount: dqn };
}

export function verdictTooltip(v: Verdict, p: string): string {
  const header = `${p}xx · ${v.label}`;
  const bullets = v.flags.map(f => `• ${f.t}`).join('\n');
  return bullets ? `${header}\n${bullets}` : header;
}
