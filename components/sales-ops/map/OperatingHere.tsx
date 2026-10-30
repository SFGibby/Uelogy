'use client';

import type { Agg, FilterState } from './types';
import { getAgg, installCount } from './heat';

const SANS = 'var(--font-swagger-sans), -apple-system, system-ui, sans-serif';
const DISPLAY = 'var(--font-swagger-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-swagger-mono), ui-monospace, monospace';

const SURFACE = '#171B38';
const LINE_HI = 'rgba(255,255,255,0.14)';
const TEXT = '#FFFFFF';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

const NE: Array<{ abbr: string; name: string }> = [
  { abbr: 'CT', name: 'Connecticut' },
  { abbr: 'DE', name: 'Delaware' },
  { abbr: 'MA', name: 'Massachusetts' },
  { abbr: 'MD', name: 'Maryland' },
  { abbr: 'NH', name: 'New Hampshire' },
  { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'RI', name: 'Rhode Island' },
  { abbr: 'VT', name: 'Vermont' },
  { abbr: 'DC', name: 'DC' },
];

interface Props {
  agg: Agg;
  filter: FilterState;
  onSelectState: (abbr: string) => void;
}

export default function OperatingHere({ agg, filter, onSelectState }: Props) {
  return (
    <div style={{ fontFamily: SANS, color: TEXT }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: MUTED, textTransform: 'uppercase', marginBottom: 10 }}>
        Operating here
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {NE.map(({ abbr, name }) => {
          const row = getAgg(agg, 'S', filter, abbr);
          const n = installCount(row);
          return (
            <button
              key={abbr}
              onClick={() => onSelectState(abbr)}
              style={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr auto',
                gap: 10,
                alignItems: 'center',
                padding: '8px 12px',
                background: SURFACE,
                border: `1px solid ${LINE_HI}`,
                borderRadius: 8,
                cursor: 'pointer',
                color: TEXT,
                fontFamily: SANS,
                textAlign: 'left',
              }}
            >
              <span style={{ fontFamily: DISPLAY, fontSize: 13, letterSpacing: '0.08em', color: SUN }}>{abbr}</span>
              <span style={{ fontSize: 12, color: '#CED3E8' }}>{name}</span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: n ? TEXT : MUTED, fontWeight: 700 }}>
                {n ? n.toLocaleString() : '\u2013'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
