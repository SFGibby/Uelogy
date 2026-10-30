'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { buildScorecards, REGIONS, type Cadence, type ScorecardRow } from '../../lib/sales-ops/fake-ops-data';

type Role = 'exec' | 'regional';

// Gibson design tokens.
const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';
const DISPLAY = 'var(--font-gibson-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';

const INK = '#0D1023';
const SURFACE = '#171B38';
const SURFACE_HI = '#242A58';
const LINE = 'rgba(255,255,255,0.08)';
const LINE_HI = 'rgba(255,255,255,0.15)';
const TEXT = '#FFFFFF';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';
const GOOD = '#5EE493';
const WATCH = '#FFD54F';
const BEHIND = '#FF5E7A';

const CADENCES: { key: Cadence; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'qtr', label: 'Quarter' },
];

type BucketKey = 'overall' | 'knocks' | 'sits' | 'closes' | 'leadToConversion' | 'pullThrough' | 'installs' | 'recruited' | 'retention';

const BUCKETS: { key: BucketKey; label: string; format: (r: ScorecardRow) => string }[] = [
  { key: 'overall',          label: 'Overall',    format: r => `${r.overall}` },
  { key: 'knocks',           label: 'Knocks',     format: r => r.knocks.toLocaleString() },
  { key: 'sits',             label: 'Sits',       format: r => r.sits.toLocaleString() },
  { key: 'closes',           label: 'Closes',     format: r => r.closes.toLocaleString() },
  { key: 'leadToConversion', label: 'L\u2192C',   format: r => `${r.leadToConversion}%` },
  { key: 'pullThrough',      label: 'Pull-thru',  format: r => `${r.pullThrough}%` },
  { key: 'installs',         label: 'Installs',   format: r => r.installs.toLocaleString() },
  { key: 'recruited',        label: 'Recruited',  format: r => `${r.recruited}` },
  { key: 'retention',        label: 'Retention',  format: r => `${r.retention}%` },
];

export default function HubGibson() {
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

  const activeBucket = BUCKETS.find(b => b.key === metric)!;
  const scopeLabel = role === 'regional' ? region.toUpperCase() : 'NATIONAL';

  return (
    <div style={{ background: INK, color: TEXT, fontFamily: SANS, minHeight: 'calc(100vh - 55px)' }}>
      {/* HERO */}
      <section style={{ padding: '56px 32px 32px', borderBottom: `1px solid ${LINE}`, position: 'relative', overflow: 'hidden' }}>
        <GlowOverlay />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.3em', color: SUN, textTransform: 'uppercase', marginBottom: 20 }}>
              {scopeLabel} &middot; {activeBucket.label} &middot; This {cadence}
            </div>
            <h1
              style={{
                margin: 0,
                fontFamily: DISPLAY,
                fontSize: 'clamp(44px, 7vw, 88px)',
                lineHeight: 0.92,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                color: TEXT,
              }}
            >
              {activeBucket.label}
            </h1>
            <p style={{ marginTop: 16, maxWidth: 540, fontSize: 15, lineHeight: 1.6, color: SUBTLE }}>
              One metric, one answer. Pick a different chip to re-rank. Tap a row to open the full card.
            </p>
          </div>

          <HeroScore avg={avg} metric={activeBucket.label} />
        </div>
      </section>

      {/* CONTROLS */}
      <section style={{ padding: '20px 32px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <RoleToggle role={role} setRole={setRole} region={region} setRegion={setRegion} />
        <CadenceToggle cadence={cadence} setCadence={setCadence} />
      </section>

      {/* METRIC CHIPS */}
      <section style={{ padding: '22px 32px 8px' }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: MUTED, textTransform: 'uppercase', marginBottom: 12 }}>
          Metric
        </div>
        <MetricChips metric={metric} setMetric={setMetric} />
      </section>

      {/* SEARCH */}
      <section style={{ padding: '18px 32px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reps or teams"
          style={{
            flex: 1,
            maxWidth: 360,
            padding: '12px 14px',
            background: SURFACE,
            color: TEXT,
            border: `1px solid ${LINE_HI}`,
            borderRadius: 999,
            outline: 'none',
            fontFamily: SANS,
            fontSize: 14,
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              background: 'transparent',
              color: SUBTLE,
              border: `1px solid ${LINE_HI}`,
              borderRadius: 999,
              padding: '10px 16px',
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {rows.length} {rows.length === 1 ? 'rep' : 'reps'}
        </div>
      </section>

      {/* ROWS */}
      <section style={{ padding: '14px 32px 64px' }}>
        {rows.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: MUTED, fontSize: 14 }}>No reps match.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

function GlowOverlay() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 60% 50% at 85% 20%, rgba(250,214,70,0.18), transparent 70%),' +
          'radial-gradient(ellipse 50% 60% at 0% 100%, rgba(250,109,29,0.08), transparent 70%)',
      }}
    />
  );
}

function HeroScore({ avg, metric }: { avg: number; metric: string }) {
  return (
    <div style={{ position: 'relative', textAlign: 'right', minWidth: 240 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: MUTED, textTransform: 'uppercase', marginBottom: 10 }}>
        Avg {metric}
      </div>
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: 'clamp(84px, 10vw, 160px)',
          lineHeight: 0.88,
          letterSpacing: '-0.04em',
          color: SUN,
        }}
      >
        {avg}
      </div>
    </div>
  );
}

function RoleToggle({ role, setRole, region, setRegion }: { role: Role; setRole: (r: Role) => void; region: string; setRegion: (r: string) => void }) {
  const base: React.CSSProperties = {
    padding: '9px 18px',
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    border: 0,
    background: 'transparent',
    color: SUBTLE,
  };
  const active: React.CSSProperties = { background: SUN, color: INK };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'inline-flex', background: SURFACE, border: `1px solid ${LINE_HI}`, borderRadius: 999, overflow: 'hidden' }}>
        <button onClick={() => setRole('exec')} style={{ ...base, ...(role === 'exec' ? active : {}) }}>National</button>
        <button onClick={() => setRole('regional')} style={{ ...base, ...(role === 'regional' ? active : {}) }}>Regional</button>
      </div>
      {role === 'regional' && (
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={{
            background: SURFACE,
            color: TEXT,
            border: `1px solid ${LINE_HI}`,
            padding: '9px 14px',
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            borderRadius: 999,
          }}
        >
          {REGIONS.map(r => <option key={r} value={r} style={{ background: SURFACE }}>{r}</option>)}
        </select>
      )}
    </div>
  );
}

function CadenceToggle({ cadence, setCadence }: { cadence: Cadence; setCadence: (c: Cadence) => void }) {
  return (
    <div style={{ display: 'inline-flex', background: SURFACE, border: `1px solid ${LINE_HI}`, borderRadius: 999, overflow: 'hidden' }}>
      {CADENCES.map(c => {
        const active = c.key === cadence;
        return (
          <button
            key={c.key}
            onClick={() => setCadence(c.key)}
            style={{
              padding: '9px 18px',
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              background: active ? SUN : 'transparent',
              color: active ? INK : SUBTLE,
              border: 0,
              cursor: 'pointer',
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {BUCKETS.map(b => {
        const active = b.key === metric;
        return (
          <button
            key={b.key}
            onClick={() => setMetric(b.key)}
            style={{
              padding: '10px 20px',
              background: active ? SUN : 'transparent',
              color: active ? INK : TEXT,
              border: `1px solid ${active ? SUN : LINE_HI}`,
              borderRadius: 999,
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
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
    <div style={{ background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '72px 1fr auto 44px',
          gap: 18,
          alignItems: 'center',
          padding: '18px 24px',
          background: 'transparent',
          color: TEXT,
          border: 0,
          cursor: 'pointer',
          fontFamily: SANS,
          textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: DISPLAY, fontSize: 28, color: rank <= 3 ? SUN : MUTED, letterSpacing: '-0.02em' }}>
          {String(rank).padStart(2, '0')}
        </span>
        <span>
          <div style={{ fontFamily: DISPLAY, fontSize: 20, color: TEXT, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
            {r.rep}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, marginTop: 4, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {r.team}
          </div>
        </span>
        <span
          style={{
            fontFamily: DISPLAY,
            fontSize: 44,
            color: metric === 'overall' ? scoreColor : SUN,
            letterSpacing: '-0.03em',
            textAlign: 'right',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <span
          style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `1px solid ${LINE_HI}`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: SUBTLE, lineHeight: 1,
          }}
          aria-hidden
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '22px 24px 26px', borderTop: `1px solid ${LINE}`, background: SURFACE_HI }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
            {BUCKETS.filter(b => b.key !== 'overall').map(b => (
              <div key={b.key}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>
                  {b.label}
                </div>
                <div style={{ fontFamily: DISPLAY, fontSize: 28, color: TEXT, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {b.format(r)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${LINE}`, display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Overall</span>
            <span style={{ fontFamily: DISPLAY, fontSize: 36, color: scoreColor, letterSpacing: '-0.025em' }}>{r.overall}</span>
            <span style={{ fontSize: 12, color: MUTED }}>/ 100 &middot; equal weighting across 8 buckets</span>
          </div>
        </div>
      )}
    </div>
  );
}
