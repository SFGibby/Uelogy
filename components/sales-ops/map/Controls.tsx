'use client';

import { useMemo, useRef, useState } from 'react';
import type { Channel, FilterState, MetricKey, StateShadingKey, WindowKey, Zip3Meta } from './types';
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
  zip3?: Zip3Meta[];
  onSelectState?: (abbr: string | null) => void;
  onSelectZip3?: (zip3: string | null) => void;
  financiers?: { key: string; name: string }[] | null;
}

const WINDOW_DAYS: Record<WindowKey, number> = { '3': 90, '6': 180, '12': 365 };

function snapToWindow(days: number): WindowKey {
  if (days <= 135) return '3';
  if (days <= 270) return '6';
  return '12';
}

interface Suggestion {
  kind: 'state' | 'city' | 'zip3' | 'zip5';
  label: string;
  hint: string;
  state: string | null;
  zip3: string | null;
}

const STATE_INDEX: Array<{ abbr: string; name: string }> = [
  { abbr: 'AL', name: 'Alabama' }, { abbr: 'AK', name: 'Alaska' }, { abbr: 'AZ', name: 'Arizona' }, { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' }, { abbr: 'CT', name: 'Connecticut' }, { abbr: 'DE', name: 'Delaware' },
  { abbr: 'DC', name: 'District of Columbia' }, { abbr: 'FL', name: 'Florida' }, { abbr: 'GA', name: 'Georgia' }, { abbr: 'HI', name: 'Hawaii' },
  { abbr: 'ID', name: 'Idaho' }, { abbr: 'IL', name: 'Illinois' }, { abbr: 'IN', name: 'Indiana' }, { abbr: 'IA', name: 'Iowa' },
  { abbr: 'KS', name: 'Kansas' }, { abbr: 'KY', name: 'Kentucky' }, { abbr: 'LA', name: 'Louisiana' }, { abbr: 'ME', name: 'Maine' },
  { abbr: 'MD', name: 'Maryland' }, { abbr: 'MA', name: 'Massachusetts' }, { abbr: 'MI', name: 'Michigan' }, { abbr: 'MN', name: 'Minnesota' },
  { abbr: 'MS', name: 'Mississippi' }, { abbr: 'MO', name: 'Missouri' }, { abbr: 'MT', name: 'Montana' }, { abbr: 'NE', name: 'Nebraska' },
  { abbr: 'NV', name: 'Nevada' }, { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey' }, { abbr: 'NM', name: 'New Mexico' },
  { abbr: 'NY', name: 'New York' }, { abbr: 'NC', name: 'North Carolina' }, { abbr: 'ND', name: 'North Dakota' }, { abbr: 'OH', name: 'Ohio' },
  { abbr: 'OK', name: 'Oklahoma' }, { abbr: 'OR', name: 'Oregon' }, { abbr: 'PA', name: 'Pennsylvania' }, { abbr: 'RI', name: 'Rhode Island' },
  { abbr: 'SC', name: 'South Carolina' }, { abbr: 'SD', name: 'South Dakota' }, { abbr: 'TN', name: 'Tennessee' }, { abbr: 'TX', name: 'Texas' },
  { abbr: 'UT', name: 'Utah' }, { abbr: 'VT', name: 'Vermont' }, { abbr: 'VA', name: 'Virginia' }, { abbr: 'WA', name: 'Washington' },
  { abbr: 'WV', name: 'West Virginia' }, { abbr: 'WI', name: 'Wisconsin' }, { abbr: 'WY', name: 'Wyoming' },
];

export default function Controls({ filter, onChange, totalInstalls, totalMedian, zip3, onSelectState, onSelectZip3, financiers }: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = filter.query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: Suggestion[] = [];

    for (const s of STATE_INDEX) {
      if (s.name.toLowerCase().startsWith(q) || s.abbr.toLowerCase() === q) {
        out.push({ kind: 'state', label: s.name, hint: s.abbr, state: s.abbr, zip3: null });
      }
      if (out.length >= 4) break;
    }

    if (zip3 && zip3.length) {
      const zipExact = /^\d+$/.test(q);
      if (zipExact && q.length >= 3) {
        const prefix = q.slice(0, 3);
        const z = zip3.find(r => r.p === prefix);
        if (z) out.push({ kind: q.length >= 4 ? 'zip5' : 'zip3', label: q.length >= 4 ? q : `${prefix}xx`, hint: `${z.city}, ${z.st}`, state: z.st, zip3: prefix });
      }
      for (const r of zip3) {
        if (out.length >= 10) break;
        if (r.city && r.city.toLowerCase().startsWith(q)) {
          out.push({ kind: 'city', label: r.city, hint: `${r.st} · ${r.p}xx`, state: r.st, zip3: r.p });
        }
      }
    }
    return out.slice(0, 10);
  }, [filter.query, zip3]);

  const pick = (s: Suggestion) => {
    onChange({ query: '' });
    setSearchOpen(false);
    if (s.state) onSelectState?.(s.state);
    if (s.zip3) onSelectZip3?.(s.zip3);
  };

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
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <PillGroup
          label="Shade"
          value={filter.stateShading}
          options={[
            { k: 'metric', l: 'Install' },
            { k: 'rate', l: 'Utility' },
            { k: 'financier', l: 'Lenders' },
          ]}
          onChange={(v) => {
            const patch: Partial<FilterState> = { stateShading: v as StateShadingKey };
            if (v !== 'financier') patch.financierFilter = null;
            onChange(patch);
          }}
        />
        {filter.stateShading === 'financier' && (financiers?.length ?? 0) > 0 && (
          <select
            value={filter.financierFilter ?? ''}
            onChange={e => onChange({ financierFilter: e.target.value || null })}
            style={{
              background: SURFACE,
              color: TEXT,
              border: `1px solid ${LINE_HI}`,
              borderRadius: 999,
              padding: '10px 36px 10px 16px',
              fontFamily: SANS,
              fontSize: 13,
              outline: 'none',
              appearance: 'none',
              backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23CED3E8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
            }}
          >
            <option value="" style={{ background: SURFACE }}>By lender count</option>
            {financiers!.map(f => (
              <option key={f.key} value={f.key} style={{ background: SURFACE }}>{f.name}</option>
            ))}
          </select>
        )}
      </div>
      <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
        <input
          type="search"
          value={filter.query}
          onChange={(e) => { onChange({ query: e.target.value }); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => { blurTimer.current = setTimeout(() => setSearchOpen(false), 160); }}
          placeholder="Search city, state, ZIP3, or ZIP5"
          style={{
            width: '100%',
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
        {searchOpen && suggestions.length > 0 && (
          <ul
            onMouseDown={() => { if (blurTimer.current) clearTimeout(blurTimer.current); }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              listStyle: 'none',
              margin: 0,
              padding: 6,
              background: SURFACE,
              border: `1px solid ${LINE_HI}`,
              borderRadius: 14,
              boxShadow: '0 12px 32px rgba(0,0,0,0.42)',
              maxHeight: 320,
              overflowY: 'auto',
              zIndex: 40,
            }}
          >
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  onClick={() => pick(s)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: 10,
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 0,
                    borderRadius: 8,
                    color: TEXT,
                    cursor: 'pointer',
                    fontFamily: SANS,
                    fontSize: 13,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{
                    fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em',
                    color: s.kind === 'city' ? SUN : MUTED,
                    textTransform: 'uppercase',
                  }}>
                    {s.kind}
                  </span>
                  <span style={{ color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>
                    {s.hint}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
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
