'use client';

import type { FilterState } from './types';

const MONO = 'var(--font-swagger-mono), ui-monospace, monospace';
const DISPLAY = 'var(--font-swagger-display), "Archivo Black", Impact, sans-serif';

const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

interface Props {
  filter: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
}

export default function Breadcrumb({ filter, onChange }: Props) {
  const items: Array<{ label: string; onClick: (() => void) | null }> = [
    { label: 'United States', onClick: filter.stateAbbr ? () => onChange({ stateAbbr: null, zip3: null, level: 'US' }) : null },
  ];
  if (filter.stateAbbr) items.push({ label: filter.stateAbbr, onClick: filter.zip3 ? () => onChange({ zip3: null, level: 'STATE' }) : null });
  if (filter.zip3) items.push({ label: `${filter.zip3}xx`, onClick: null });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: '0.08em' }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {i > 0 && <span style={{ color: MUTED }}>&rsaquo;</span>}
          {it.onClick ? (
            <button
              onClick={it.onClick}
              style={{ background: 'transparent', border: 0, color: SUN, cursor: 'pointer', fontFamily: DISPLAY, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', padding: 0 }}
            >
              {it.label}
            </button>
          ) : (
            <span style={{ color: SUBTLE, fontFamily: DISPLAY, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {it.label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
