'use client';

import { useMemo } from 'react';
import { useEnerfloCoverage } from './useMapData';

const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';
const SURFACE = '#171B38';
const LINE_HI = 'rgba(255,255,255,0.14)';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

interface Props {
  stateAbbr: string;
}

/**
 * Small context strip that renders above the map canvas when drilled into
 * a state. Right now it surfaces active Enerflo zones + a shortcut to the
 * Resources Adder Sheet. More badges can land here as we onboard more data.
 */
export default function StateContextBadges({ stateAbbr }: Props) {
  const enerflo = useEnerfloCoverage();

  const zones = useMemo<number[]>(() => {
    if (!enerflo) return [];
    const markets = enerflo.markets.byState[stateAbbr] ?? [];
    return [...new Set(markets.map(m => m.zone))].sort();
  }, [enerflo, stateAbbr]);

  if (zones.length === 0) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      padding: '8px 20px 10px', fontFamily: MONO, fontSize: 11, color: SUBTLE,
      letterSpacing: '0.14em', textTransform: 'uppercase',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: SURFACE, border: `1px solid ${LINE_HI}`,
        borderRadius: 999, padding: '6px 12px',
      }}>
        <span style={{ color: MUTED }}>Active zones</span>
        {zones.map(z => (
          <span key={z} style={{
            fontFamily: MONO, fontSize: 10,
            background: SUN, color: '#0D1023',
            padding: '2px 7px', borderRadius: 999, fontWeight: 700, letterSpacing: '0.08em',
          }}>
            Z{z}
          </span>
        ))}
      </div>
      <a
        href="/sales-ops/data/pdfs/adder-sheet-2026-10-09.pdf"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: SUN, textDecoration: 'none', fontFamily: MONO,
          fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
          borderBottom: `1px solid rgba(250,214,70,0.4)`, paddingBottom: 1,
        }}
      >
        Open adder sheet &rsaquo;
      </a>
    </div>
  );
}
