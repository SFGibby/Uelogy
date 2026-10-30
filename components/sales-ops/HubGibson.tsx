'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  buildScopeRows,
  buildCompanyAggregate,
  buildRepDeals,
  REGIONS,
  TEAMS_BY_REGION,
  type Cadence,
  type Scope,
  type ScopeRow,
  type RepDealsPayload,
  type RepDeal,
} from '../../lib/sales-ops/fake-ops-data';

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

const BUCKETS: { key: BucketKey; label: string; format: (r: ScopeRow) => string }[] = [
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

  const [scope, setScope] = useState<Scope>('company');
  const [region, setRegion] = useState<string | null>(null);
  const [team, setTeam] = useState<string | null>(null);
  const [cadence, setCadence] = useState<Cadence>('month');
  const [metric, setMetric] = useState<BucketKey>('overall');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [repOpen, setRepOpen] = useState<string | null>(null);

  useEffect(() => {
    // Prefer URL params, then localStorage, else default to company view.
    const qRegion = params.get('region');
    const qTeam = params.get('team');
    const qQuery = params.get('q') ?? '';
    const stored = (typeof window !== 'undefined' && (localStorage.getItem('sales_ops_scope') as Scope | null)) ?? null;
    const storedRegion = typeof window !== 'undefined' ? localStorage.getItem('sales_ops_region') : null;
    const storedTeam = typeof window !== 'undefined' ? localStorage.getItem('sales_ops_team') : null;
    if (qTeam) { setScope('team'); setRegion(qRegion ?? regionForTeam(qTeam)); setTeam(qTeam); }
    else if (qRegion) { setScope('region'); setRegion(qRegion); setTeam(null); }
    else if (stored) {
      setScope(stored);
      setRegion(storedRegion);
      setTeam(storedTeam);
    }
    if (qQuery) setQuery(qQuery);
  }, [params]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sales_ops_scope', scope);
    if (region) localStorage.setItem('sales_ops_region', region); else localStorage.removeItem('sales_ops_region');
    if (team) localStorage.setItem('sales_ops_team', team); else localStorage.removeItem('sales_ops_team');
  }, [scope, region, team]);

  const rows = useMemo(() => {
    const list = buildScopeRows(cadence, scope, region, team);
    const q = query.trim().toLowerCase();
    const filtered = q
      ? list.filter(r => r.label.toLowerCase().includes(q) || r.context.toLowerCase().includes(q))
      : list;
    return [...filtered].sort((a, b) => (b[metric as keyof ScopeRow] as number) - (a[metric as keyof ScopeRow] as number));
  }, [scope, region, team, cadence, query, metric]);

  const companyAgg = useMemo(() => buildCompanyAggregate(cadence), [cadence]);

  const activeBucket = BUCKETS.find(b => b.key === metric)!;
  const scopeLabel = scope === 'company' ? 'Company' : scope === 'region' ? (region ?? '').toUpperCase() : (team ?? '').toUpperCase();
  const headerAvg = scope === 'company'
    ? companyAgg[metric as keyof ScopeRow] as number
    : (rows.length > 0 ? Math.round(rows.reduce((s, r) => s + (r[metric as keyof ScopeRow] as number), 0) / rows.length) : 0);

  function drillRow(r: ScopeRow) {
    if (r.kind === 'region' && r.region) { setScope('region'); setRegion(r.region); setTeam(null); setExpanded(null); setQuery(''); return; }
    if (r.kind === 'team' && r.region && r.team) { setScope('team'); setRegion(r.region); setTeam(r.team); setExpanded(null); setQuery(''); return; }
    // Rep row — toggle expand.
    setExpanded(prev => prev === r.key ? null : r.key);
  }

  function openRep(repName: string) {
    setRepOpen(repName);
  }

  return (
    <div style={{ background: INK, color: TEXT, fontFamily: SANS, minHeight: 'calc(100vh - 55px)' }}>
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
              {helpCopy(scope)}
            </p>
          </div>
          <HeroScore avg={headerAvg} metric={activeBucket.label} />
        </div>
      </section>

      <section style={{ padding: '14px 32px 10px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <ScopeBreadcrumb
          scope={scope}
          region={region}
          team={team}
          onCompany={() => { setScope('company'); setRegion(null); setTeam(null); setExpanded(null); setQuery(''); }}
          onRegion={() => { setScope('region'); setTeam(null); setExpanded(null); setQuery(''); }}
        />
      </section>

      <section style={{ padding: '14px 32px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <ScopePicker
          scope={scope}
          region={region}
          team={team}
          onScope={(s) => {
            setScope(s);
            setExpanded(null);
            if (s === 'company') { setRegion(null); setTeam(null); }
            if (s === 'region' && !region) setRegion(REGIONS[0]);
            if (s === 'team') {
              if (!region) setRegion(REGIONS[0]);
              const r = region ?? REGIONS[0];
              if (!team) setTeam(TEAMS_BY_REGION[r]?.[0] ?? null);
            }
          }}
          onRegion={(r) => { setRegion(r); setTeam(null); if (scope === 'team') setTeam(TEAMS_BY_REGION[r]?.[0] ?? null); setExpanded(null); }}
          onTeam={(t) => { setTeam(t); setExpanded(null); }}
        />
        <CadenceToggle cadence={cadence} setCadence={setCadence} />
      </section>

      <section style={{ padding: '22px 32px 8px' }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: MUTED, textTransform: 'uppercase', marginBottom: 12 }}>
          Metric
        </div>
        <MetricChips metric={metric} setMetric={setMetric} />
      </section>

      <section style={{ padding: '18px 32px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${scope === 'team' ? 'reps' : scope === 'region' ? 'teams' : 'regions'}`}
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
          <button onClick={() => setQuery('')} style={clearBtn}>Clear</button>
        )}
        <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {rows.length} {rowNoun(scope, rows.length)}
        </div>
      </section>

      <section style={{ padding: '14px 32px 64px' }}>
        {rows.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: MUTED, fontSize: 14 }}>Nothing matches.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map((r, i) => (
              <ScopeRowTile
                key={r.key}
                rank={i + 1}
                row={r}
                metric={metric}
                expanded={expanded === r.key}
                onToggle={() => drillRow(r)}
                onRepOpen={openRep}
              />
            ))}
          </div>
        )}
      </section>

      {repOpen && <RepDrilldown repName={repOpen} cadence={cadence} onClose={() => setRepOpen(null)} />}
    </div>
  );
}

function regionForTeam(teamName: string): string | null {
  for (const [region, teams] of Object.entries(TEAMS_BY_REGION)) {
    if (teams.includes(teamName)) return region;
  }
  return null;
}

function helpCopy(scope: Scope): string {
  if (scope === 'company') return 'Four regions, one view. Pick a region to see teams, or a team to see the reps.';
  if (scope === 'region') return 'Teams in this region, scored on the same chip you picked above. Tap a team to open its reps.';
  return 'The reps on this team. Tap a row to open the breakdown, click any number to open accounts.';
}

function rowNoun(scope: Scope, n: number): string {
  if (scope === 'company') return n === 1 ? 'region' : 'regions';
  if (scope === 'region') return n === 1 ? 'team' : 'teams';
  return n === 1 ? 'rep' : 'reps';
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
      <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(84px, 10vw, 160px)', lineHeight: 0.88, letterSpacing: '-0.04em', color: SUN }}>
        {Number.isFinite(avg) ? avg : 0}
      </div>
    </div>
  );
}

function ScopeBreadcrumb({
  scope, region, team, onCompany, onRegion,
}: { scope: Scope; region: string | null; team: string | null; onCompany: () => void; onRegion: () => void }) {
  const items: Array<{ label: string; active: boolean; onClick?: () => void }> = [
    { label: 'Company', active: scope === 'company', onClick: scope === 'company' ? undefined : onCompany },
  ];
  if (region) items.push({ label: region, active: scope === 'region', onClick: scope === 'region' ? undefined : onRegion });
  if (team && scope === 'team') items.push({ label: team, active: true });

  return (
    <nav style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
      {items.map((it, i) => (
        <span key={it.label}>
          <button
            onClick={it.onClick}
            disabled={!it.onClick}
            style={{
              background: 'transparent', border: 0, padding: 0,
              color: it.active ? SUN : SUBTLE,
              fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit',
              cursor: it.onClick ? 'pointer' : 'default',
            }}
          >
            {it.label}
          </button>
          {i < items.length - 1 && <span style={{ color: MUTED, margin: '0 10px' }}>{'\u203A'}</span>}
        </span>
      ))}
    </nav>
  );
}

function ScopePicker({
  scope, region, team, onScope, onRegion, onTeam,
}: {
  scope: Scope; region: string | null; team: string | null;
  onScope: (s: Scope) => void;
  onRegion: (r: string) => void;
  onTeam: (t: string) => void;
}) {
  const regionTeams = region ? TEAMS_BY_REGION[region] ?? [] : [];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ display: 'inline-flex', background: SURFACE, border: `1px solid ${LINE_HI}`, borderRadius: 999, overflow: 'hidden' }}>
        {(['company', 'region', 'team'] as Scope[]).map(s => (
          <button
            key={s}
            onClick={() => onScope(s)}
            style={{
              padding: '9px 18px',
              background: s === scope ? SUN : 'transparent',
              color: s === scope ? INK : SUBTLE,
              border: 0,
              cursor: 'pointer',
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            {s === 'company' ? 'Company' : s === 'region' ? 'Region' : 'Team'}
          </button>
        ))}
      </div>
      {scope !== 'company' && (
        <select
          value={region ?? ''}
          onChange={(e) => onRegion(e.target.value)}
          style={pillSelect}
          aria-label="Region"
        >
          {REGIONS.map(r => <option key={r} value={r} style={{ background: SURFACE }}>{r}</option>)}
        </select>
      )}
      {scope === 'team' && region && (
        <select
          value={team ?? ''}
          onChange={(e) => onTeam(e.target.value)}
          style={pillSelect}
          aria-label="Team"
        >
          {regionTeams.map(t => <option key={t} value={t} style={{ background: SURFACE }}>{t}</option>)}
        </select>
      )}
      {scope === 'team' && (
        <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Teams land from Enzy
        </span>
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

function ScopeRowTile({
  rank, row, metric, expanded, onToggle, onRepOpen,
}: {
  rank: number; row: ScopeRow; metric: BucketKey; expanded: boolean;
  onToggle: () => void;
  onRepOpen: (name: string) => void;
}) {
  const bucket = BUCKETS.find(b => b.key === metric)!;
  const value = bucket.format(row);
  const scoreColor = row.overall >= 85 ? GOOD : row.overall >= 70 ? WATCH : BEHIND;
  const isRep = row.kind === 'rep';

  return (
    <div style={{ background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        aria-expanded={isRep ? expanded : undefined}
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
            {row.label}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, marginTop: 4, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {row.context}
          </div>
        </span>
        <span style={{ fontFamily: DISPLAY, fontSize: 44, color: metric === 'overall' ? scoreColor : SUN, letterSpacing: '-0.03em', textAlign: 'right', lineHeight: 1 }}>
          {value}
        </span>
        <span style={affordance}>
          {isRep ? (
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}
              aria-hidden
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="9 6 15 12 9 18" />
            </svg>
          )}
        </span>
      </button>

      {isRep && expanded && (
        <div style={{ padding: '22px 24px 26px', borderTop: `1px solid ${LINE}`, background: SURFACE_HI }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
            {BUCKETS.filter(b => b.key !== 'overall').map(b => (
              <button
                key={b.key}
                onClick={() => onRepOpen(row.label)}
                style={{
                  background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                  color: TEXT, textAlign: 'left', fontFamily: SANS,
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>
                  {b.label}
                </div>
                <div style={{ fontFamily: DISPLAY, fontSize: 28, color: TEXT, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {b.format(row)}
                </div>
                <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 10, color: SUN, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Open deals
                </div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${LINE}`, display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Overall</span>
            <span style={{ fontFamily: DISPLAY, fontSize: 36, color: scoreColor, letterSpacing: '-0.025em' }}>{row.overall}</span>
            <span style={{ fontSize: 12, color: MUTED }}>/ 100 &middot; equal weighting across 8 buckets</span>
            <button onClick={() => onRepOpen(row.label)} style={{ ...pillSelect, marginLeft: 'auto', cursor: 'pointer', color: SUN, borderColor: SUN }}>
              Open account view
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- rep drill-down -------------------------------------------------------

function RepDrilldown({ repName, cadence, onClose }: { repName: string; cadence: Cadence; onClose: () => void }) {
  const data = useMemo<RepDealsPayload>(() => buildRepDeals(repName, cadence), [repName, cadence]);
  const [stageFilter, setStageFilter] = useState<string | 'all'>('all');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const deals = useMemo(() => {
    if (stageFilter === 'all') return data.deals;
    return data.deals.filter(d => d.stage === stageFilter);
  }, [data.deals, stageFilter]);

  const stages = useMemo(() => {
    const s = new Set<string>();
    for (const d of data.deals) s.add(d.stage);
    return Array.from(s);
  }, [data.deals]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(5,7,20,0.72)',
        zIndex: 80, display: 'flex', justifyContent: 'flex-end',
        fontFamily: SANS,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(680px, 100%)',
          height: '100%',
          background: INK,
          borderLeft: `1px solid ${LINE_HI}`,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${LINE_HI}`, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: SUN, textTransform: 'uppercase', marginBottom: 6 }}>
              Rep detail
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>{data.rep}</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4 }}>
              {data.region} &middot; {data.team}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: `1px solid ${LINE_HI}`, color: SUBTLE, borderRadius: 999, padding: '8px 14px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Close
          </button>
        </div>

        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${LINE}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <RepStat label="Signed" value={`${data.signedCount}`} />
          <RepStat label="Installed" value={`${data.installedCount}`} />
          <RepStat label="Pull-thru" value={`${data.pullThroughPct}%`} tone={data.pullThroughPct >= 90 ? GOOD : data.pullThroughPct >= 85 ? WATCH : BEHIND} />
          <RepStat label="Avg → install" value={`${data.avgDaysToInstall}d`} />
        </div>

        <div style={{ padding: '14px 24px 8px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <StageChip label={`All (${data.deals.length})`} active={stageFilter === 'all'} onClick={() => setStageFilter('all')} />
          {stages.map(s => (
            <StageChip key={s} label={`${s} (${data.deals.filter(d => d.stage === s).length})`} active={stageFilter === s} onClick={() => setStageFilter(s)} />
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 24px' }}>
          {deals.length === 0 ? (
            <div style={{ padding: 40, color: MUTED, textAlign: 'center' }}>No deals in that stage.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {deals.map(d => <DealRow key={d.id} deal={d} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RepStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 24, color: tone ?? TEXT, letterSpacing: '-0.02em' }}>
        {value}
      </div>
    </div>
  );
}

function StageChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px',
        background: active ? SUN : 'transparent',
        color: active ? INK : SUBTLE,
        border: `1px solid ${active ? SUN : LINE_HI}`,
        borderRadius: 999,
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function DealRow({ deal }: { deal: RepDeal }) {
  const toneBg = deal.pullThrough === 'installed' ? GOOD
    : deal.pullThrough === 'at-risk' ? WATCH
    : deal.pullThrough === 'cancelled' ? BEHIND
    : SUN;
  const toneLabel = deal.pullThrough === 'installed' ? 'Installed'
    : deal.pullThrough === 'at-risk' ? 'At risk'
    : deal.pullThrough === 'cancelled' ? 'Cancelled'
    : 'Live';
  return (
    <div style={{ background: SURFACE, border: `1px solid ${LINE_HI}`, borderRadius: 10, padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: 15, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>{deal.customer}</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4 }}>
          {deal.city} &middot; signed {deal.signedOn}
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: SUBTLE, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{deal.stage}</span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{deal.daysInStage}d in stage</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 18, color: TEXT, letterSpacing: '-0.01em' }}>
          ${(deal.valueUsd / 1000).toFixed(1)}k
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${toneBg}`,
          color: toneBg,
          borderRadius: 999,
          fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700,
        }}>
          {toneLabel}
        </span>
      </div>
    </div>
  );
}

// --- shared styles -------------------------------------------------------

const clearBtn: React.CSSProperties = {
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
};

const pillSelect: React.CSSProperties = {
  background: SURFACE,
  color: TEXT,
  border: `1px solid ${LINE_HI}`,
  padding: '9px 14px',
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  borderRadius: 999,
};

const affordance: React.CSSProperties = {
  width: 36, height: 36, borderRadius: '50%',
  border: `1px solid ${LINE_HI}`,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  color: SUBTLE, lineHeight: 1,
};
