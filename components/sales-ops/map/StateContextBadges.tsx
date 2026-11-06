'use client';

import { useMemo } from 'react';
import { useEnerfloCoverage, useUtilityRates } from './useMapData';

const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';
const SURFACE = '#171B38';
const LINE_HI = 'rgba(255,255,255,0.14)';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

interface Props {
  stateAbbr: string;
}

export default function StateContextBadges({ stateAbbr }: Props) {
  const enerflo = useEnerfloCoverage();
  const utility = useUtilityRates();

  const zones = useMemo<number[]>(() => {
    if (!enerflo) return [];
    const markets = enerflo.markets.byState[stateAbbr] ?? [];
    return [...new Set(markets.map(m => m.zone))].sort();
  }, [enerflo, stateAbbr]);

  const rate = utility?.rates[stateAbbr];
  const rateBand = rate != null && utility
    ? utility.bands.find(b => rate >= b[0] && rate < b[1])?.[2] ?? null
    : null;

  if (zones.length === 0 && rate == null) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      padding: '8px 20px 10px', fontFamily: MONO, fontSize: 11, color: SUBTLE,
      letterSpacing: '0.14em', textTransform: 'uppercase',
    }}>
      {zones.length > 0 && (
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
      )}
      {rate != null && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: SURFACE, border: `1px solid ${LINE_HI}`,
          borderRadius: 999, padding: '6px 12px',
        }}>
          <span style={{ color: MUTED }}>Utility rate</span>
          <span style={{
            fontFamily: MONO, fontSize: 10,
            background: 'rgba(84,140,220,0.22)', color: '#CBD9F2',
            padding: '2px 7px', borderRadius: 999, fontWeight: 700, letterSpacing: '0.08em',
          }}>
            {rate.toFixed(1)}¢ / kWh
          </span>
          {rateBand && <span style={{ color: MUTED, fontSize: 10 }}>{rateBand}</span>}
        </div>
      )}
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
