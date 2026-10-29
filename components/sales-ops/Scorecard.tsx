'use client';

import { useMemo, useState } from 'react';
import { buildScorecards, type Cadence, type ScorecardRow } from '../../lib/sales-ops/fake-ops-data';
import type { SharedTheme } from './HubShared';

const CADENCES: { key: Cadence; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'qtr', label: 'Quarter' },
];

type SortKey = 'overall' | 'knocks' | 'sits' | 'closes' | 'leadToConversion' | 'pullThrough' | 'installs' | 'recruited' | 'retention';

export default function Scorecard({ theme, region, limit = 25 }: { theme: SharedTheme; region: string | null; limit?: number }) {
  const [cadence, setCadence] = useState<Cadence>('month');
  const [sortKey, setSortKey] = useState<SortKey>('overall');
  const [sortAsc, setSortAsc] = useState(false);
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const data = buildScorecards(cadence, region);
    const q = query.trim().toLowerCase();
    const filtered = q
      ? data.filter(r => r.rep.toLowerCase().includes(q) || r.team.toLowerCase().includes(q))
      : data;
    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortKey as keyof ScorecardRow] as number;
      const bv = b[sortKey as keyof ScorecardRow] as number;
      return sortAsc ? av - bv : bv - av;
    });
    return sorted.slice(0, limit);
  }, [cadence, region, sortKey, sortAsc, limit, query]);

  const avg = useMemo(() => {
    if (rows.length === 0) return 0;
    return Math.round(rows.reduce((s, r) => s + r.overall, 0) / rows.length);
  }, [rows]);

  function flip(key: SortKey) {
    if (sortKey === key) setSortAsc(x => !x);
    else { setSortKey(key); setSortAsc(false); }
  }

  const display = theme.display ?? theme.serif ?? theme.sans;

  return (
    <div>
      {/* Topline + cadence toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: theme.mono, fontSize: 10, letterSpacing: '0.26em', color: theme.muted, textTransform: 'uppercase', marginBottom: 4 }}>
            Average rep score &middot; this {cadence}
          </div>
          <div style={{ fontFamily: display, fontSize: 48, lineHeight: 1, letterSpacing: '-0.02em', color: theme.text }}>
            {avg}
            <span style={{ fontSize: 20, color: theme.muted, marginLeft: 8 }}>/ 100</span>
          </div>
        </div>
        <CadenceToggle theme={theme} cadence={cadence} onChange={setCadence} />
      </div>

      <p style={{ fontFamily: theme.sans, fontSize: 13, color: theme.subtle, maxWidth: 760, marginTop: 0, marginBottom: 14, fontStyle: 'italic' }}>
        Equal weighting across 8 buckets. Knocks + sits come from Enzy; closes, pull-through, installs from Salesforce; recruited and retention from HR. All values illustrative for the beta.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reps or teams\u2026"
          style={{
            flex: 1,
            maxWidth: 320,
            padding: '9px 12px',
            background: theme.surface ?? 'transparent',
            color: theme.text,
            border: `1px solid ${theme.line}`,
            borderRadius: 4,
            outline: 'none',
            fontFamily: theme.sans,
            fontSize: 13,
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              background: 'transparent',
              color: theme.muted,
              border: `1px solid ${theme.line}`,
              borderRadius: 4,
              padding: '8px 12px',
              fontFamily: theme.mono,
              fontSize: 11,
              letterSpacing: '0.04em',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontFamily: theme.mono, fontSize: 11, color: theme.muted }}>
          {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </div>
      </div>

      <div style={{ border: `1px solid ${theme.line}`, background: theme.surface ?? 'transparent', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: theme.sans, fontSize: 13 }}>
          <thead>
            <tr>
              <ScorecardTh theme={theme} label="Rep" onClick={() => flip('overall')} />
              <ScorecardTh theme={theme} label="Team" />
              <ScorecardTh theme={theme} label="Knocks" onClick={() => flip('knocks')} mono align="right" />
              <ScorecardTh theme={theme} label="Sits" onClick={() => flip('sits')} mono align="right" />
              <ScorecardTh theme={theme} label="Closes" onClick={() => flip('closes')} mono align="right" />
              <ScorecardTh theme={theme} label="L→C" onClick={() => flip('leadToConversion')} mono align="right" />
              <ScorecardTh theme={theme} label="Pull-thru" onClick={() => flip('pullThrough')} mono align="right" />
              <ScorecardTh theme={theme} label="Installs" onClick={() => flip('installs')} mono align="right" />
              <ScorecardTh theme={theme} label="Recruited" onClick={() => flip('recruited')} mono align="right" />
              <ScorecardTh theme={theme} label="Retention" onClick={() => flip('retention')} mono align="right" />
              <ScorecardTh theme={theme} label="Score" onClick={() => flip('overall')} mono align="right" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <ScorecardTr key={`${r.rep}-${i}`} theme={theme} r={r} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScorecardTh({ theme, label, onClick, mono, align = 'left' }: { theme: SharedTheme; label: string; onClick?: () => void; mono?: boolean; align?: 'left' | 'right' }) {
  return (
    <th
      onClick={onClick}
      style={{
        padding: '12px 14px',
        fontSize: 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: theme.muted,
        textAlign: align,
        fontFamily: mono ? theme.mono : theme.sans,
        fontWeight: 500,
        borderBottom: `1px solid ${theme.line}`,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {label}
    </th>
  );
}

function ScorecardTr({ theme, r }: { theme: SharedTheme; r: ScorecardRow }) {
  const scoreColor = r.overall >= 85 ? theme.good : r.overall >= 70 ? theme.watch : theme.behind;
  const td: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle', borderTop: `1px solid ${theme.line}` };
  const num: React.CSSProperties = { ...td, fontFamily: theme.mono, textAlign: 'right' };

  return (
    <tr>
      <td style={{ ...td, color: theme.text, fontWeight: 500 }}>{r.rep}</td>
      <td style={{ ...td, color: theme.muted, fontFamily: theme.mono, fontSize: 11, letterSpacing: '0.08em' }}>{r.team}</td>
      <td style={num}>{r.knocks}</td>
      <td style={num}>{r.sits}</td>
      <td style={num}>{r.closes}</td>
      <td style={num}>{r.leadToConversion}%</td>
      <td style={num}>{r.pullThrough}%</td>
      <td style={num}>{r.installs}</td>
      <td style={num}>{r.recruited}</td>
      <td style={num}>{r.retention}%</td>
      <td style={{ ...num, color: scoreColor, fontWeight: 700, fontSize: 15 }}>{r.overall}</td>
    </tr>
  );
}

function CadenceToggle({ theme, cadence, onChange }: { theme: SharedTheme; cadence: Cadence; onChange: (c: Cadence) => void }) {
  const base: React.CSSProperties = {
    padding: '10px 16px',
    fontFamily: theme.mono,
    fontSize: 10,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    border: `1px solid ${theme.line}`,
    background: 'transparent',
    color: theme.muted,
  };
  return (
    <div style={{ display: 'inline-flex' }}>
      {CADENCES.map((c, i) => {
        const active = cadence === c.key;
        return (
          <button
            key={c.key}
            onClick={() => onChange(c.key)}
            style={{
              ...base,
              background: active ? theme.accent : 'transparent',
              color: active ? theme.ink : theme.muted,
              borderColor: active ? theme.accent : theme.line,
              borderRight: i === CADENCES.length - 1 ? `1px solid ${active ? theme.accent : theme.line}` : 'none',
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
