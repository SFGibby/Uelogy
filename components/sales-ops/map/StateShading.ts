// State-level fill for the national view.
// Three modes selectable from the Controls radio:
//   metric      — install metric heatmap (the map's original behavior)
//   rate        — 4-band blue by residential utility rate
//   financiers  — green by number of financiers, or binary if a single
//                 financier is selected

import type { Financier, UtilityRates, StateShadingKey } from './types';

// Blue ramp for utility rate bands. Deeper blue = higher ¢/kWh.
const RATE_COLORS = [
  'rgba(84, 140, 220, 0.18)',
  'rgba(84, 140, 220, 0.34)',
  'rgba(84, 140, 220, 0.52)',
  'rgba(84, 140, 220, 0.72)',
];

// Green ramp for financier count.
const FIN_COLORS = [
  'rgba(94, 228, 147, 0.20)',   // 1 financier
  'rgba(94, 228, 147, 0.42)',   // 2 financiers
  'rgba(94, 228, 147, 0.66)',   // 3+ financiers
];

export function rateBandIndex(rate: number, bands: UtilityRates['bands']): number {
  for (let i = 0; i < bands.length; i++) {
    const [lo, hi] = bands[i];
    if (rate >= lo && rate < hi) return i;
  }
  return bands.length - 1;
}

export function utilityRateFill(abbr: string, utility: UtilityRates | null): string | null {
  if (!utility) return null;
  const r = utility.rates[abbr];
  if (r == null) return null;
  const idx = rateBandIndex(r, utility.bands);
  return RATE_COLORS[Math.min(idx, RATE_COLORS.length - 1)];
}

export function financierCount(abbr: string, financiers: Financier[]): number {
  let n = 0;
  for (const f of financiers) if (f.states.includes(abbr)) n++;
  return n;
}

export function financierFill(
  abbr: string,
  financiers: Financier[],
  singleFinancierKey: string | null,
): string | null {
  if (singleFinancierKey) {
    const f = financiers.find(x => x.key === singleFinancierKey);
    if (!f) return null;
    return f.states.includes(abbr) ? FIN_COLORS[2] : null;
  }
  const n = financierCount(abbr, financiers);
  if (n <= 0) return null;
  return FIN_COLORS[Math.min(n - 1, FIN_COLORS.length - 1)];
}

export function stateShadingFill(args: {
  abbr: string;
  mode: StateShadingKey;
  utility: UtilityRates | null;
  financiers: Financier[] | null;
  singleFinancierKey: string | null;
}): string | null {
  if (args.mode === 'rate') return utilityRateFill(args.abbr, args.utility);
  return null;   // 'metric' — caller handles with the existing install-metric heat
}
