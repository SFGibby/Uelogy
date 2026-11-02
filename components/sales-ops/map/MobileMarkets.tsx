'use client';

import { useMemo, useState } from 'react';
import type { Agg, FilterState, Zip3Meta } from './types';
import { getAgg, installCount, pickMetric } from './heat';
import { useEnerfloCoverage } from './useMapData';

const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';
const DISPLAY = 'var(--font-gibson-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';

const INK = '#0D1023';
const SURFACE = '#171B38';
const LINE_HI = 'rgba(255,255,255,0.14)';
const TEXT = '#FFFFFF';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';
const GOOD = '#5EE493';
const WATCH = '#FFD54F';
const BEHIND = '#FF8A3D';

interface Props {
  agg: Agg;
  zip3: Zip3Meta[];
  filter: FilterState;
  onSelectState: (abbr: string) => void;
  onSelectZip3: (p: string) => void;
}

type Row = {
  key: string;
  state: string;
  metro: string;
  zone: number;
  zip3: string;
  zip3Count: number;
  installs: number;
  median: number | null;
};

export default function MobileMarkets({ agg, zip3, filter, onSelectState, onSelectZip3 }: Props) {
  const enerflo = useEnerfloCoverage();
  const [query, setQuery] = useState('');

  // Build one row per (state × metro × zone) from Enerflo, pulling install
  // data from AGG for the ZIP3s that fall inside that market. If the current
  // drill is a state, scope to that state only.
  const rows = useMemo<Row[]>(() => {
    if (!enerflo) return [];
    const out: Row[] = [];
    const stateFilter = filter.stateAbbr;
    for (const [state, markets] of Object.entries(enerflo.markets.byState)) {
      if (stateFilter && state !== stateFilter) continue;
      for (const m of markets) {
        // Which ZIP3s does this market touch?
        const z3Set = new Set<string>();
        for (const z5 of m.zips) z3Set.add(z5.slice(0, 3));
        let totalInstalls = 0;
        const medians: number[] = [];
        for (const z3 of z3Set) {
          const row = getAgg(agg, 'Z3', filter, z3);
          const n = installCount(row);
          if (n > 0) totalInstalls += n;
          const med = pickMetric(row, 'med');
          if (med != null) medians.push(med);
        }
        const med = medians.length ? Math.round(medians.reduce((s, v) => s + v, 0) / medians.length) : null;
        out.push({
          key: `${state}-${m.metro}-${m.zone}`,
          state,
          metro: m.metro,
          zone: m.zone,
          zip3: [...z3Set].sort().join(', '),
          zip3Count: z3Set.size,
          installs: totalInstalls,
          median: med,
        });
      }
    }
    const q = query.trim().toLowerCase();
    const filtered = q
      ? out.filter(r =>
          r.state.toLowerCase().includes(q) ||
          r.metro.toLowerCase().includes(q) ||
          r.zip3.toLowerCase().includes(q) ||
          `zone ${r.zone}`.includes(q),
        )
      : out;
    return [...filtered].sort((a, b) => b.installs - a.installs);
  }, [enerflo, agg, zip3, filter, query]);

  function medTone(med: number | null): string {
    if (med == null) return MUTED;
    if (med <= 60) return GOOD;
    if (med <= 85) return WATCH;
    return BEHIND;
  }

  return (
    <div style={{ background: INK, color: TEXT, fontFamily: SANS }}>
      <section style={{ padding: '20px 16px 10px' }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: SUN, textTransform: 'uppercase', marginBottom: 8 }}>
          {filter.stateAbbr ? `${filter.stateAbbr} markets` : 'All markets'}
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: DISPLAY,
            fontSize: 'clamp(28px, 7vw, 44px)',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
          }}
        >
          Where we <span style={{ color: SUN }}>sell</span>.
        </h2>
        <p style={{ marginTop: 10, color: SUBTLE, fontSize: 13, lineHeight: 1.5 }}>
          Searchable list of open territories. Tap a row to see the ZIP breakdown.
        </p>
      </section>

      <div style={{ padding: '12px 16px 10px', position: 'sticky', top: 55, background: INK, zIndex: 10, borderBottom: `1px solid ${LINE_HI}` }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search state, metro, or ZIP3"
          style={{
            width: '100%',
            padding: '12px 16px',
            background: SURFACE,
            color: TEXT,
            border: `1px solid ${LINE_HI}`,
            borderRadius: 999,
            outline: 'none',
            fontSize: 14,
            fontFamily: SANS,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 8 }}>
          {rows.length} market{rows.length === 1 ? '' : 's'}
        </div>
      </div>

      <section style={{ padding: '8px 16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: MUTED, fontSize: 13 }}>Nothing matches.</div>
        ) : rows.map(r => (
          <button
            key={r.key}
            onClick={() => {
              if (!filter.stateAbbr) {
                onSelectState(r.state);
              } else {
                // Already in state view — tap a market → drill into its first ZIP3
                const first = r.zip3.split(',')[0]?.trim();
                if (first) onSelectZip3(first);
              }
            }}
            style={{
              background: SURFACE,
              border: `1px solid ${LINE_HI}`,
              borderRadius: 12,
              padding: '14px 16px',
              color: TEXT,
              fontFamily: SANS,
              textAlign: 'left',
              cursor: 'pointer',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 14, letterSpacing: '0.1em', color: SUN }}>{r.state}</span>
                <span style={{ fontFamily: DISPLAY, fontSize: 15, letterSpacing: '-0.01em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.metro}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: MUTED, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Z{r.zone}</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {r.zip3Count} ZIP3{r.zip3Count === 1 ? '' : 's'} \u00b7 {r.zip3.length > 40 ? r.zip3.slice(0, 40) + '\u2026' : r.zip3}
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 20, letterSpacing: '-0.02em', color: TEXT }}>
                {r.installs.toLocaleString()}
              </span>
              {r.median != null ? (
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: medTone(r.median) }}>
                  {r.median}d
                </span>
              ) : (
                <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.14em' }}>no data</span>
              )}
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}
