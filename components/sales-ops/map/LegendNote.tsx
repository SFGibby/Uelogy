'use client';

import type { FilterState, UtilityRates, Financier } from './types';
import { METRICS } from './types';

const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';

interface Props {
  filter: FilterState;
  utility: UtilityRates | null;
  financiers: Financier[] | null;
}

export default function LegendNote({ filter, utility, financiers }: Props) {
  const parts: string[] = [];

  if (filter.dq) parts.push('Hatched: not serviced');

  if (filter.stateShading === 'metric') {
    const m = METRICS.find(x => x.key === filter.metric);
    const label = m ? m.label.toLowerCase() : 'install metric';
    parts.push(`Warm fill: ${label} (brighter = faster)`);
  } else if (filter.stateShading === 'rate' && utility) {
    const bandLabels = utility.bands.map(b => b[2]).join(', ');
    parts.push(`Blue shades: utility rate ¢/kWh (${bandLabels})`);
  } else if (filter.stateShading === 'financiers') {
    if (filter.shadingFinancier && financiers) {
      const f = financiers.find(x => x.key === filter.shadingFinancier);
      if (f) parts.push(`Green: states served by ${f.name}`);
    } else {
      parts.push('Green shades: financier count (1, 2, 3 or more)');
    }
  }

  const text = parts.length ? parts.join(' · ') : 'No overlays active.';

  return (
    <div
      style={{
        position: 'absolute',
        left: 14,
        bottom: 14,
        maxWidth: 'calc(100% - 28px)',
        padding: '7px 11px',
        background: 'rgba(13, 16, 35, 0.78)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        color: '#CED3E8',
        fontFamily: MONO,
        fontSize: 10.5,
        letterSpacing: '0.08em',
        lineHeight: 1.45,
        pointerEvents: 'none',
        backdropFilter: 'blur(6px)',
        zIndex: 2,
      }}
    >
      {text}
    </div>
  );
}
