'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { buildScorecards, REGIONS, type Cadence, type ScorecardRow } from '../../lib/sales-ops/fake-ops-data';
import type { SharedTheme } from './HubShared';

type Role = 'exec' | 'regional';

const SANS = 'Arial, Helvetica, sans-serif';
const MONO = 'ui-monospace, Menlo, Consolas, monospace';

const INK = '#162241';
const SURFACE = '#1A2648';
const SURFACE_HI = '#1D2C55';
const LINE = '#26355f';
const LINE_HI = '#33436e';
const TEXT = '#ffffff';
const TEXT_SOFT = '#e6e9f0';
const SUBTLE = '#cfd5e2';
const MUTED = '#9aa3b5';
const SUN = '#FAD646';
const GOOD = '#4ADE80';
const WATCH = '#FACC15';
const BEHIND = '#F43F5E';

const CADENCES: { key: Cadence; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'qtr', label: 'Quarter' },
];

type BucketKey = 'overall' | 'knocks' | 'sits' | 'closes' | 'leadToConversion' | 'pullThrough' | 'installs' | 'recruited' | 'retention';

const BUCKETS: { key: BucketKey; label: string; format: (r: ScorecardRow) => string }[] = [
  { key: 'overall', label: 'Overall', format: r => `${r.overall}` },
  { key: 'knocks', label: 'Knocks', format: r => r.knocks.toLocaleString() },
  { key: 'sits', label: 'Sits', format: r => r.sits.toLocaleString() },
  { key: 'closes', label: 'Closes', format: r => r.closes.toLocaleString() },
  { key: 'leadToConversion', label: 'L\u2192C', format: r => `${r.leadToConversion}%` },
  { key: 'pullThrough', label: 'Pull-thru', format: r => `${r.pullThrough}%` },
  { key: 'installs', label: 'Installs', format: r => r.installs.toLocaleString() },
  { key: 'recruited', label: 'Recruited', format: r => `${r.recruited}` },
  { key: 'retention', label: 'Retention', format: r => `${r.retention}%` },
];

export default function HubSwagger() {
  const params = useSearchParams();
  const initialRole = (params.get('view') as Role | null) ?? null;
  const initialRegion = params.get('region');
  const initialQuery = params.get('q') ?? '';

  const [role, setRole] = useState<Role>('exec');
  const [region, setRegion] = useState<string>(REGIONS[0]);
  const [cadence, setCadence] = useState<Cadence>('month');
  const [metric, setMetric] = useState<BucketKey>('overall');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Hydrate from localStorage + URL params on mount.
  useEffect(() => {
    const stored = (localStorage.getItem('sales_ops_role') as Role | null) ?? 'exec';
    const storedRegion = localStorage.getItem('sales_ops_region') ?? REGIONS[0];
    setRole(initialRole ?? stored);
    setRegion(initialRegion ?? storedRegion);
    if (initialQuery) setQuery(initialQuery);
  }, [initialRole, initialRegion, initialQuery]);

  useEffect(() => {
    localStorage.setItem('sales_ops_role', role);
    localStorage.setItem('sales_ops_region', region);
  }, [role, region]);

  const rows = useMemo(() => {
    const scopeRegion = role === 'regional' ? region : null;
    const data = buildScorecards(cadence, scopeRegion);
    const q = query.trim().toLowerCase();
    const filtered = q
      ? data.filter(r => r.rep.toLowerCase().includes(q) || r.team.toLowerCase().includes(q))
      : data;
    return [...filtered].sort((a, b) => (b[metric as keyof ScorecardRow] as number) - (a[metric as keyof ScorecardRow] as number));
  }, [role, region, cadence, query, metric]);

  const avg = useMemo(() => {
    if (rows.length === 0) return 0;
    return Math.round(rows.reduce((s, r) => s + r.overall, 0) / rows.length);
  }, [rows]);

  return (
    <div style={{ background: INK, color: TEXT_SOFT, fontFamily: SANS, minHeight: 'calc(100vh - 55px)' }}>
      <PageHeader
        role={role}
        setRole={setRole}
        region={region}
        setRegion={setRegion}
        avg={avg}
        cadence={cadence}
        setCadence={setCadence}
      />

      <section style={{ padding: '18px 28px', borderBottom: `1px solid ${LINE}` }}>
        <MetricChips metric={metric} setMetric={setMetric} />
      </section>

      <section style={{ padding: '14px 28px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reps or teams\u2026"
          style={{
            flex: 1,
            maxWidth: 320,
            padding: '9px 12px',
            background: SURFACE,
            color: TEXT,
            border: `1px solid ${LINE_HI}`,
            borderRadius: 4,
            outline: 'none',
            fontFamily: SANS,
            fontSize: 13,
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              background: 'transparent',
              color: MUTED,
              border: `1px solid ${LINE}`,
              borderRadius: 4,
              padding: '8px 12px',
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.04em',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: MUTED }}>
          {rows.length} {rows.length === 1 ? 'rep' : 'reps'}
        </div>
      </section>

      <section style={{ padding: '14px 28px 48px' }}>
        {rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: MUTED, fontSize: 13 }}>
            No reps match.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rows.map((r, i) => (
              <RepRow
                key={`${r.rep}-${i}`}
                rank={i + 1}
                r={r}
                metric={metric}
                expanded={expanded === r.rep}
                onToggle={() => setExpanded(expanded === r.rep ? null : r.rep)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PageHeader({ role, setRole, region, setRegion, avg, cadence, setCadence }: { role: Role; setRole: (r: Role) => void; region: string; setRegion: (r: string) => void; avg: number; cadence: Cadence; setCadence: (c: Cadence) => void }) {
  const title = role === 'regional' ? `${region} pulse` : 'National pulse';
  return (
    <div style={{ padding: '20px 28px 22px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: TEXT, letterSpacing: '-0.005em' }}>{title}</h1>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 10 }}>
          <span style={{ fontSize: 44, fontWeight: 700, color: TEXT, letterSpacing: '-0.02em', lineHeight: 1 }}>{avg}</span>
          <span style={{ fontSize: 13, color: MUTED }}>avg rep score &middot; this {cadence}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
        <RoleToggle role={role} setRole={setRole} region={region} setRegion={setRegion} />
        <CadenceToggle cadence={cadence} setCadence={setCadence} />
      </div>
    </div>
  );
}

function RoleToggle({ role, setRole, region, setRegion }: { role: Role; setRole: (r: Role) => void; region: string; setRegion: (r: string) => void }) {
  const base: React.CSSProperties = {
    padding: '7px 14px',
    fontFamily: SANS,
    fontSize: 12,
    cursor: 'pointer',
    border: 0,
    background: 'transparent',
    color: SUBTLE,
  };
  const active: React.CSSProperties = { background: SURFACE_HI, color: TEXT };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'inline-flex', border: `1px solid ${LINE_HI}`, borderRadius: 4, overflow: 'hidden' }}>
        <button onClick={() => setRole('exec')} style={{ ...base, ...(role === 'exec' ? active : {}) }}>National</button>
        <button onClick={() => setRole('regional')} style={{ ...base, ...(role === 'regional' ? active : {}) }}>Regional</button>
      </div>
      {role === 'regional' && (
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={{ background: SURFACE, color: TEXT, border: `1px solid ${LINE_HI}`, padding: '7px 10px', fontFamily: SANS, fontSize: 12, borderRadius: 4 }}
        >
          {REGIONS.map(r => <option key={r} value={r} style={{ background: SURFACE }}>{r}</option>)}
        </select>
      )}
    </div>
  );
}

function CadenceToggle({ cadence, setCadence }: { cadence: Cadence; setCadence: (c: Cadence) => void }) {
  return (
    <div style={{ display: 'inline-flex', border: `1px solid ${LINE_HI}`, borderRadius: 4, overflow: 'hidden' }}>
      {CADENCES.map(c => {
        const active = c.key === cadence;
        return (
          <button
            key={c.key}
            onClick={() => setCadence(c.key)}
            style={{
              padding: '7px 14px',
              fontFamily: SANS,
              fontSize: 12,
              background: active ? SUN : 'transparent',
              color: active ? INK : SUBTLE,
              border: 0,
              cursor: 'pointer',
              fontWeight: active ? 700 : 400,
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function MetricChips({ metric, setMetric }: { metric: BucketKey; setMetric: (m: BucketKey) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {BUCKETS.map(b => {
        const active = b.key === metric;
        return (
          <button
            key={b.key}
            onClick={() => setMetric(b.key)}
            style={{
              padding: '8px 14px',
              background: active ? SUN : 'transparent',
              color: active ? INK : SUBTLE,
              border: `1px solid ${active ? SUN : LINE_HI}`,
              borderRadius: 999,
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: active ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {b.label}
          </button>
        );
      })}
    </div>
  );
}

function RepRow({ rank, r, metric, expanded, onToggle }: { rank: number; r: ScorecardRow; metric: BucketKey; expanded: boolean; onToggle: () => void }) {
  const bucket = BUCKETS.find(b => b.key === metric)!;
  const value = bucket.format(r);
  const scoreColor = r.overall >= 85 ? GOOD : r.overall >= 70 ? WATCH : BEHIND;

  return (
    <div style={{ background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 6, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '48px 1fr auto auto',
          gap: 16,
          alignItems: 'center',
          padding: '14px 18px',
          background: 'transparent',
          color: TEXT,
          border: 0,
          cursor: 'pointer',
          fontFamily: SANS,
          textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: 13, color: MUTED, letterSpacing: '0.04em' }}>
          {String(rank).padStart(2, '0')}
        </span>
        <span>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{r.rep}</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, marginTop: 2, letterSpacing: '0.04em' }}>{r.team}</div>
        </span>
        <span style={{ fontSize: 24, fontWeight: 700, color: metric === 'overall' ? scoreColor : TEXT, letterSpacing: '-0.015em', textAlign: 'right' }}>
          {value}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.04em' }}>
          {expanded ? '\u2212' : '+'}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '16px 18px 18px', borderTop: `1px solid ${LINE}`, background: SURFACE_HI }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {BUCKETS.filter(b => b.key !== 'overall').map(b => (
              <div key={b.key}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', color: MUTED, textTransform: 'uppercase', marginBottom: 4 }}>
                  {b.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>{b.format(r)}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${LINE}`, display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.04em' }}>Overall score</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: scoreColor }}>{r.overall}</span>
            <span style={{ fontSize: 11, color: MUTED }}>/ 100 &middot; equal weighting across 8 buckets</span>
          </div>
        </div>
      )}
    </div>
  );
}
