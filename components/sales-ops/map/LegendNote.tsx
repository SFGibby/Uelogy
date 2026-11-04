'use client';

import { useState } from 'react';
import type { FilterState, UtilityRates, Financier } from './types';
import { METRICS } from './types';

const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';

const INK = '#0D1023';
const LINE_HI = 'rgba(255,255,255,0.14)';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

const SPEED_GRADIENT = 'linear-gradient(90deg, rgb(255,112,70) 0%, rgb(255,160,70) 32%, rgb(250,214,70) 55%, rgb(168,220,90) 75%, rgb(94,228,147) 100%)';
const RATE_GRADIENT = 'linear-gradient(90deg, rgba(84,140,220,0.18) 0%, rgba(84,140,220,0.72) 100%)';

interface Props {
  filter: FilterState;
  utility: UtilityRates | null;
  financiers: Financier[] | null;
}

/**
 * Visible legend panel on the map. Shows swatches for every symbol users
 * encounter so the viewer doesn't have to guess what a tint, hatch, or dim
 * state means. Collapsible so it doesn't dominate the frame when ignored.
 */
export default function LegendNote({ filter, financiers }: Props) {
  const [open, setOpen] = useState(true);

  const activeMetric = METRICS.find(m => m.key === filter.metric)?.label ?? 'install metric';
  const financierName = filter.financierFilter
    ? financiers?.find(f => f.key === filter.financierFilter)?.name
    : null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 14,
        bottom: 14,
        maxWidth: 'calc(100% - 28px)',
        width: open ? 280 : 'auto',
        background: 'rgba(13, 16, 35, 0.92)',
        border: `1px solid ${LINE_HI}`,
        borderRadius: 10,
        color: SUBTLE,
        fontFamily: SANS,
        backdropFilter: 'blur(8px)',
        zIndex: 2,
      }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          background: 'transparent',
          border: 0,
          color: SUN,
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          textAlign: 'left',
          padding: '9px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <span>Legend</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: '2px 12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filter.stateShading === 'metric' ? (
            <LegendRow
              title={activeMetric}
              hint="Brighter = faster"
              preview={<Bar gradient={SPEED_GRADIENT} />}
              endLabels={['Slow', 'Mid', 'Fast']}
            />
          ) : (
            <LegendRow
              title="Utility rate"
              hint="¢ / kWh, 4 bands"
              preview={<Bar gradient={RATE_GRADIENT} />}
              endLabels={['Low', 'High']}
            />
          )}

          <LegendRow
            title="Workable area"
            hint="Direct markets, no installs yet"
            preview={<SolidSwatch color="rgba(250,214,70,0.28)" border="rgba(250,214,70,0.55)" />}
          />

          <LegendRow
            title="Not serviced"
            hint="Opacity scales with DQ ratio"
            preview={<HatchSwatch />}
          />

          <LegendRow
            title="State border"
            hint="Clipped to the real state outline"
            preview={<LineSwatch />}
          />

          {financierName && (
            <LegendRow
              title={`Greyed: no ${financierName}`}
              hint="Financier filter active"
              preview={<SolidSwatch color="rgba(140,150,190,0.08)" border="rgba(255,255,255,0.08)" />}
            />
          )}
        </div>
      )}
    </div>
  );
}

function LegendRow({ title, hint, preview, endLabels }: {
  title: string;
  hint?: string;
  preview: React.ReactNode;
  endLabels?: string[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flexShrink: 0 }}>{preview}</div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: SUBTLE, textTransform: 'uppercase' }}>
            {title}
          </span>
          {hint && (
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase', marginTop: 1 }}>
              {hint}
            </span>
          )}
        </div>
      </div>
      {endLabels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 42, fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>
          {endLabels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

function Bar({ gradient }: { gradient: string }) {
  return (
    <div style={{
      width: 32, height: 10, borderRadius: 4,
      background: gradient,
      border: `1px solid ${INK}`,
    }} />
  );
}

function SolidSwatch({ color, border }: { color: string; border: string }) {
  return (
    <div style={{
      width: 32, height: 16, borderRadius: 4,
      background: color, border: `1px solid ${border}`,
    }} />
  );
}

function HatchSwatch() {
  return (
    <div style={{
      width: 32, height: 16, borderRadius: 4,
      background: 'repeating-linear-gradient(45deg, rgba(13,16,35,0.9) 0 1.2px, rgba(255,255,255,0.18) 1.2px 5px)',
      border: `1px solid ${LINE_HI}`,
    }} />
  );
}

function LineSwatch() {
  return (
    <div style={{
      width: 32, height: 16, borderRadius: 4,
      background: 'transparent',
      border: `1.5px solid rgba(205,215,235,0.55)`,
    }} />
  );
}
