'use client';

import { useState } from 'react';
import type { Channel, FilterState, MetricKey, StateShadingKey, WindowKey } from './types';
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

const WINDOW_DAYS: Record<WindowKey, number> = { '3': 90, '6': 180, '12': 365 };

function snapToWindow(days: number): WindowKey {
  if (days <= 135) return '3';
  if (days <= 270) return '6';
  return '12';
}

export default function Controls({ filter, onChange, totalInstalls, totalMedian }: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const customDays = customStart && customEnd
    ? Math.max(1, Math.round((new Date(customEnd).getTime() - new Date(customStart).getTime()) / 86400000))
    : null;
  const snapped: WindowKey | null = customDays ? snapToWindow(customDays) : null;

  const applyCustom = (start: string, end: string) => {
    setCustomStart(start);
    setCustomEnd(end);
    if (start && end) {
      const days = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
      const key = snapToWindow(days);
      if (key !== filter.window) onChange({ window: key });
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px 22px',
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
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <PillGroup
          label="Window"
          value={customOpen ? '__custom__' : filter.window}
          options={[
            ...WINDOWS.map(w => ({ k: w.key, l: w.label })),
            { k: '__custom__', l: 'Custom' },
          ]}
          onChange={(v) => {
            if (v === '__custom__') {
              setCustomOpen(true);
            } else {
              setCustomOpen(false);
              setCustomStart('');
              setCustomEnd('');
              onChange({ window: v as WindowKey });
            }
          }}
        />
        {customOpen && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="date"
              value={customStart}
              onChange={e => applyCustom(e.target.value, customEnd)}
              style={dateInput}
            />
            <span style={{ color: MUTED, fontSize: 12 }}>to</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => applyCustom(customStart, e.target.value)}
              style={dateInput}
            />
            {snapped && (
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase' }}>
                · {customDays} d · snapped to {WINDOW_DAYS[snapped] / 30} mo
              </span>
            )}
          </div>
        )}
      </div>
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
            padding: '10px 36px 10px 20px',
            fontFamily: SANS,
            fontSize: 13,
            outline: 'none',
            appearance: 'none',
            backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23CED3E8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
          }}
        >
          {METRICS.map(m => <option key={m.key} value={m.key} style={{ background: SURFACE }}>{m.label}</option>)}
        </select>
      </div>
      <PillGroup
        label="Shade"
        value={filter.stateShading}
        options={[
          { k: 'metric', l: 'Install' },
          { k: 'rate', l: 'Utility' },
        ]}
        onChange={(v) => onChange({ stateShading: v as StateShadingKey })}
      />
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
      {typeof totalInstalls === 'number' && !customOpen && (
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

const dateInput: React.CSSProperties = {
  background: SURFACE,
  color: TEXT,
  border: `1px solid ${LINE_HI}`,
  borderRadius: 8,
  padding: '6px 10px',
  fontFamily: SANS,
  fontSize: 12,
  outline: 'none',
  colorScheme: 'dark',
};

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
