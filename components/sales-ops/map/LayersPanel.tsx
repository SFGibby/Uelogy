'use client';

import { useState } from 'react';
import type { FilterState, LayerVisibility } from './types';

const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';

const SURFACE = '#171B38';
const LINE = 'rgba(255,255,255,0.08)';
const LINE_HI = 'rgba(255,255,255,0.14)';
const TEXT = '#FFFFFF';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

interface Props {
  filter: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
}

export default function LayersPanel({ filter, onChange }: Props) {
  const [open, setOpen] = useState(true);

  const setLayer = (k: keyof LayerVisibility, v: boolean) => {
    onChange({ layers: { ...filter.layers, [k]: v } });
  };

  return (
    <section
      style={{
        background: SURFACE,
        border: `1px solid ${LINE_HI}`,
        borderRadius: 12,
        fontFamily: SANS,
        color: TEXT,
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          background: 'transparent',
          border: 0,
          borderBottom: open ? `1px solid ${LINE}` : 0,
          color: TEXT,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.26em', color: SUN, textTransform: 'uppercase' }}>
            Layers
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase', marginTop: 4 }}>
            {countOn(filter.layers)} visible
          </div>
        </div>
        <Chevron open={open} />
      </button>

      {open && (
        <div style={{ padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GroupLabel>Blitzes</GroupLabel>
          <Row label="Current" color="rgba(255, 140, 70, 0.9)" checked={filter.layers.blitzCurrent} onChange={v => setLayer('blitzCurrent', v)} />
          <Row label="Planned" color="rgba(110, 170, 255, 0.9)" dashed checked={filter.layers.blitzPlanned} onChange={v => setLayer('blitzPlanned', v)} />

          <GroupLabel>Overlays</GroupLabel>
          <Row label="Install heat" color="rgba(250, 214, 70, 0.8)" checked={filter.layers.install} onChange={v => setLayer('install', v)} />
          <Row label="Workable area" color="rgba(250, 214, 70, 0.35)" checked={filter.layers.workable} onChange={v => setLayer('workable', v)} />
          <Row label="Not serviced" hatch checked={filter.layers.dq} onChange={v => setLayer('dq', v)} />
          <Row label="City labels" color="rgba(205, 215, 235, 0.65)" dot checked={filter.layers.cities} onChange={v => setLayer('cities', v)} />
        </div>
      )}
    </section>
  );
}

function countOn(l: LayerVisibility): string {
  const keys: (keyof LayerVisibility)[] = ['install', 'workable', 'dq', 'blitzCurrent', 'blitzPlanned', 'cities'];
  const on = keys.filter(k => l[k]).length;
  return `${on} / ${keys.length}`;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', color: MUTED, textTransform: 'uppercase' }}>
      {children}
    </div>
  );
}

function Row({ label, color, checked, onChange, dashed, hatch, dot }: {
  label: string;
  color?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  dashed?: boolean;
  hatch?: boolean;
  dot?: boolean;
}) {
  return (
    <label style={{
      display: 'grid',
      gridTemplateColumns: 'auto 22px 1fr',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
      fontSize: 13,
      color: checked ? SUBTLE : MUTED,
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ accentColor: SUN, width: 16, height: 16, cursor: 'pointer' }}
      />
      <span
        aria-hidden
        style={{
          width: 22, height: 14, borderRadius: 4,
          background: hatch
            ? 'repeating-linear-gradient(45deg, rgba(13,16,35,0.9) 0 1.2px, rgba(255,255,255,0.18) 1.2px 5px)'
            : dot
              ? 'transparent'
              : color,
          border: dashed ? `1.5px dashed ${color ?? 'white'}` : `1px solid ${LINE_HI}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: checked ? 1 : 0.35,
        }}
      >
        {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: color ?? 'white' }} />}
      </span>
      <span>{label}</span>
    </label>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <span style={{ color: MUTED, transition: 'transform 160ms ease', transform: open ? 'rotate(180deg)' : 'none' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  );
}
