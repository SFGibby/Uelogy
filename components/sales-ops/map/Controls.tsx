'use client';

import type { Channel, FilterState, MetricKey, WindowKey } from './types';
import { METRICS, WINDOWS } from './types';

const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';
const DISPLAY = 'var(--font-gibson-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';

const INK = '#0D1023';
const SURFACE = '#171B38';
const LINE_HI = 'rgba(255,255,255,0.15)';
const TEXT = '#FFFFFF';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

interface Props {
  filter: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  totalInstalls?: number;
  totalMedian?: number | null;
}

export default function Controls({ filter, onChange, totalInstalls, totalMedian }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        padding: '14px 20px',
        background: INK,
        borderBottom: `1px solid ${LINE_HI}`,
        fontFamily: SANS,
      }}
    >
      <PillGroup
        label="Channel"
        value={filter.channel}
        options={[{ k: 'D', l: 'Direct' }, { k: 'E', l: 'EPC' }]}
        onChange={(v) => onChange({ channel: v as Channel })}
      />
      <PillGroup
        label="Window"
        value={filter.window}
        options={WINDOWS.map(w => ({ k: w.key, l: w.label }))}
        onChange={(v) => onChange({ window: v as WindowKey })}
      />
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: MUTED, textTransform: 'uppercase' }}>Metric</span>
        <select
          value={filter.metric}
          onChange={(e) => onChange({ metric: e.target.value as MetricKey })}
          style={{
            background: SURFACE,
            color: TEXT,
            border: `1px solid ${LINE_HI}`,
            borderRadius: 999,
            padding: '9px 14px',
            fontFamily: SANS,
            fontSize: 13,
            outline: 'none',
          }}
        >
          {METRICS.map(m => <option key={m.key} value={m.key} style={{ background: SURFACE }}>{m.label}</option>)}
        </select>
      </div>
      <input
        type="search"
        value={filter.query}
        onChange={(e) => onChange({ query: e.target.value })}
        placeholder="Search state, ZIP3, or ZIP5"
        style={{
          flex: 1,
          minWidth: 200,
          maxWidth: 320,
          padding: '10px 14px',
          background: SURFACE,
          color: TEXT,
          border: `1px solid ${LINE_HI}`,
          borderRadius: 999,
          outline: 'none',
          fontFamily: SANS,
          fontSize: 13,
        }}
      />
      {typeof totalInstalls === 'number' && (
        <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 12, color: SUBTLE, letterSpacing: '0.04em' }}>
          <span style={{ color: SUN, fontFamily: DISPLAY, fontSize: 14, letterSpacing: '0.08em', marginRight: 8 }}>
            {filter.channel === 'D' ? 'DIRECT' : 'EPC'}
          </span>
          {totalInstalls.toLocaleString()} installs
          {totalMedian != null && (
            <> &middot; median <span style={{ color: TEXT, fontWeight: 700 }}>{Math.round(totalMedian)} d</span></>
          )}
        </div>
      )}
    </div>
  );
}

function PillGroup<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: { k: T; l: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: MUTED, textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'inline-flex', background: SURFACE, border: `1px solid ${LINE_HI}`, borderRadius: 999, overflow: 'hidden' }}>
        {options.map(opt => {
          const active = opt.k === value;
          return (
            <button
              key={opt.k}
              onClick={() => onChange(opt.k)}
              style={{
                padding: '9px 16px',
                background: active ? SUN : 'transparent',
                color: active ? INK : SUBTLE,
                border: 0,
                cursor: 'pointer',
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: active ? 700 : 400,
              }}
            >
              {opt.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
