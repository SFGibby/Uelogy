'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildSnapshot, buildRegionalSnapshot, REGIONS, type PacingRow } from '../../lib/sales-ops/fake-ops-data';
import Scorecard from './Scorecard';
import {
  OpsChannelStrip,
  OpsLeaderboards,
  LeaderboardCaveat,
  RegionalCallList,
  PullThroughFunnel,
  TeamCoachList,
  RepFlightList,
  StuckDealsBoard,
  RegionalTopline,
  OpsTabBar,
  type SharedTheme,
  type OpsTab,
} from './HubShared';

type Role = 'exec' | 'regional';

// Match the map's language: Arial, hairlines, modest sizes, understated.
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
const MUTED_DIM = '#8f9ab0';
const SUN = '#FAD646';
const GOOD = '#4ADE80';
const WATCH = '#FACC15';
const BEHIND = '#F43F5E';

const SWAGGER_THEME: SharedTheme = {
  sans: SANS,
  mono: MONO,
  ink: INK,
  text: TEXT,
  muted: MUTED,
  subtle: SUBTLE,
  line: LINE,
  accent: SUN,
  good: GOOD,
  watch: WATCH,
  behind: BEHIND,
  surface: SURFACE,
};

export default function HubSwagger() {
  const [role, setRole] = useState<Role>('exec');
  const [region, setRegion] = useState<string>(REGIONS[0]);

  useEffect(() => {
    const r = (localStorage.getItem('sales_ops_role') as Role | null) ?? 'exec';
    const g = localStorage.getItem('sales_ops_region') ?? REGIONS[0];
    setRole(r);
    setRegion(g);
  }, []);

  useEffect(() => {
    localStorage.setItem('sales_ops_role', role);
    localStorage.setItem('sales_ops_region', region);
  }, [role, region]);

  return (
    <div style={{ background: INK, color: TEXT_SOFT, fontFamily: SANS, minHeight: 'calc(100vh - 55px)' }}>
      <PageHeader role={role} setRole={setRole} region={region} setRegion={setRegion} />
      {role === 'regional' ? <RegionalPulse region={region} /> : <NationalPulse />}
    </div>
  );
}

function PageHeader({ role, setRole, region, setRegion }: { role: Role; setRole: (r: Role) => void; region: string; setRegion: (r: string) => void }) {
  const title = role === 'regional' ? `${region} \u00b7 Pulse` : 'National pulse';
  const purpose = role === 'regional'
    ? 'Who to call this morning, where deals drop, how reps are pacing. Scoped to this region.'
    : 'Where Direct Ops stands today and the reps and teams carrying the floor.';
  return (
    <div style={{ padding: '20px 28px 22px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ maxWidth: 820 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.04em', color: MUTED, marginBottom: 6 }}>
          SP &middot; Sales Ops &middot; Pulse
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: TEXT, letterSpacing: '-0.005em' }}>{title}</h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: SUBTLE, lineHeight: 1.5 }}>{purpose}</p>
      </div>
      <RoleToggle role={role} setRole={setRole} region={region} setRegion={setRegion} />
    </div>
  );
}

function RoleToggle({ role, setRole, region, setRegion }: { role: Role; setRole: (r: Role) => void; region: string; setRegion: (r: string) => void }) {
  const base: React.CSSProperties = {
    padding: '8px 14px',
    fontFamily: SANS,
    fontSize: 12,
    cursor: 'pointer',
    border: 0,
    background: 'transparent',
    color: SUBTLE,
  };
  const active: React.CSSProperties = { background: SURFACE_HI, color: TEXT };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'inline-flex', border: `1px solid ${LINE_HI}`, borderRadius: 4, overflow: 'hidden' }}>
        <button onClick={() => setRole('exec')} style={{ ...base, ...(role === 'exec' ? active : {}) }}>National</button>
        <button onClick={() => setRole('regional')} style={{ ...base, ...(role === 'regional' ? active : {}) }}>Regional</button>
      </div>
      {role === 'regional' && (
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={{ background: SURFACE, color: TEXT, border: `1px solid ${LINE_HI}`, padding: '8px 10px', fontFamily: SANS, fontSize: 12, borderRadius: 4 }}
        >
          {REGIONS.map(r => <option key={r} value={r} style={{ background: SURFACE }}>{r}</option>)}
        </select>
      )}
    </div>
  );
}

// -------------------- NATIONAL --------------------

function NationalPulse() {
  const snap = useMemo(() => buildSnapshot(), []);
  const [tab, setTab] = useState<'people' | 'winners' | 'teams' | 'scorecard'>('winners');
  const pacing = useMemo(() => [...snap.pacing].sort((a, b) => b.pct - a.pct), [snap.pacing]);

  const tabs: OpsTab[] = [
    { key: 'people', label: 'Sales exp', count: `${snap.kpis.pullThroughPct}%` },
    { key: 'winners', label: 'Winners', count: snap.leaderboards.length },
    { key: 'teams', label: 'Teams', count: pacing.length },
    { key: 'scorecard', label: 'Scorecard', count: 8 },
  ];

  return (
    <>
      <section style={{ padding: '18px 28px', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          <StatCell label="Bookings MTD" value={snap.kpis.bookingsMtd.toLocaleString()} delta={snap.kpis.bookingsDeltaPct} />
          <StatCell label="Installs MTD" value={snap.kpis.installsMtd.toLocaleString()} delta={snap.kpis.installsDeltaPct} />
          <StatCell label="Pull-through" value={`${snap.kpis.pullThroughPct}%`} delta={snap.kpis.pullThroughDeltaPct} />
          <StatCell label="Cycle time" value={`${snap.kpis.cycleDays}d`} note="trailing 90d" />
        </div>
      </section>

      <section style={{ padding: '14px 28px 0' }}>
        <OpsTabBar theme={SWAGGER_THEME} tabs={tabs} active={tab} onChange={(k) => setTab(k as typeof tab)} />
      </section>

      <section style={{ padding: '22px 28px 48px' }}>
        {tab === 'people' && <OpsChannelStrip theme={SWAGGER_THEME} channel={snap.channel} />}
        {tab === 'winners' && (
          <>
            <LeaderboardCaveat theme={SWAGGER_THEME} />
            <OpsLeaderboards theme={SWAGGER_THEME} leaderboards={snap.leaderboards} />
          </>
        )}
        {tab === 'teams' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {pacing.map(r => <TeamCard key={`${r.region}-${r.team}`} r={r} />)}
          </div>
        )}
        {tab === 'scorecard' && <Scorecard theme={SWAGGER_THEME} region={null} limit={25} />}
      </section>
    </>
  );
}

// -------------------- REGIONAL --------------------

function RegionalPulse({ region }: { region: string }) {
  const snap = useMemo(() => buildRegionalSnapshot(region), [region]);
  const [tab, setTab] = useState<'call' | 'funnel' | 'teams' | 'roster' | 'stuck' | 'scorecard'>('call');

  const tabs: OpsTab[] = [
    { key: 'call', label: 'Call list', count: snap.callList.length },
    { key: 'funnel', label: 'Pull-through', count: `${snap.pullThroughPct}%` },
    { key: 'teams', label: 'Teams', count: snap.teamRows.length },
    { key: 'roster', label: 'Roster', count: snap.reps.length },
    { key: 'stuck', label: 'Stuck', count: snap.stuckDeals.length },
    { key: 'scorecard', label: 'Scorecard', count: 8 },
  ];

  return (
    <>
      <section style={{ padding: '18px 28px', borderBottom: `1px solid ${LINE}` }}>
        <RegionalTopline theme={SWAGGER_THEME} snapshot={snap} />
      </section>

      <section style={{ padding: '14px 28px 0' }}>
        <OpsTabBar theme={SWAGGER_THEME} tabs={tabs} active={tab} onChange={(k) => setTab(k as typeof tab)} />
      </section>

      <section style={{ padding: '22px 28px 48px' }}>
        {tab === 'call' && <RegionalCallList theme={SWAGGER_THEME} items={snap.callList} />}
        {tab === 'funnel' && <PullThroughFunnel theme={SWAGGER_THEME} funnel={snap.funnel} pullThroughPct={snap.pullThroughPct} />}
        {tab === 'teams' && <TeamCoachList theme={SWAGGER_THEME} rows={snap.teamRows} />}
        {tab === 'roster' && <RepFlightList theme={SWAGGER_THEME} reps={snap.reps} />}
        {tab === 'stuck' && <StuckDealsBoard theme={SWAGGER_THEME} deals={snap.stuckDeals} />}
        {tab === 'scorecard' && <Scorecard theme={SWAGGER_THEME} region={region} limit={15} />}
      </section>
    </>
  );
}

// -------------------- CELLS --------------------

function StatCell({ label, value, delta, note }: { label: string; value: string; delta?: number; note?: string }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.04em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: TEXT, letterSpacing: '-0.015em', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 11, color: delta != null ? (delta >= 0 ? GOOD : BEHIND) : MUTED }}>
        {delta != null ? `${delta >= 0 ? '+' : ''}${delta}% MoM` : note}
      </div>
    </div>
  );
}

function TeamCard({ r }: { r: PacingRow }) {
  const status = r.pct >= 95 ? 'good' : r.pct >= 80 ? 'watch' : 'behind';
  const color = status === 'good' ? GOOD : status === 'watch' ? WATCH : BEHIND;
  const barPct = Math.min(100, Math.max(0, r.pct));
  return (
    <div style={{ background: SURFACE, border: `1px solid ${LINE}`, padding: '16px 16px', borderRadius: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.04em' }}>{r.region}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginTop: 2 }}>{r.team}</div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color }}>{r.pct}%</div>
      </div>
      <div style={{ height: 4, background: '#ffffff10', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ position: 'relative', inset: 0, width: `${barPct}%`, height: '100%', background: color }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: MONO, fontSize: 11, color: MUTED }}>
        <span>Target {r.targetMtd}</span>
        <span>Actual {r.actualMtd}</span>
      </div>
    </div>
  );
}
