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

const SANS = 'var(--font-sales-ops-sans), -apple-system, system-ui, sans-serif';
const DISPLAY = 'var(--font-sales-ops-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-sales-ops-mono), ui-monospace, monospace';

const INK = '#162241';
const SURFACE = '#1D2A4F';
const SURFACE_HI = '#263564';
const LINE = 'rgba(255,255,255,0.08)';
const LINE_HI = 'rgba(255,255,255,0.16)';
const TEXT = '#FFFFFF';
const MUTED = '#8A96B5';
const SUBTLE = '#C4CBE0';
const SUN = '#FAD646';
const GOOD = '#4ADE80';
const WATCH = '#FACC15';
const BEHIND = '#F43F5E';

const SWAGGER_THEME: SharedTheme = {
  sans: SANS,
  display: DISPLAY,
  mono: MONO,
  ink: INK,
  text: TEXT,
  muted: MUTED,
  subtle: SUBTLE,
  line: LINE_HI,
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

  async function logout() {
    await fetch('/api/grid/lock', { method: 'POST' });
    window.location.href = '/';
  }

  return (
    <div style={{ background: INK, color: TEXT, fontFamily: SANS, minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GrainOverlay />
      <RoleBar role={role} setRole={setRole} region={region} setRegion={setRegion} />
      {role === 'regional' ? <RegionalSwagger region={region} /> : <NationalSwagger />}
      <NextRow />
      <Footer />
    </div>
  );
}

function RoleBar({ role, setRole, region, setRegion }: { role: Role; setRole: (r: Role) => void; region: string; setRegion: (r: string) => void }) {
  return (
    <div style={{ padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1, borderBottom: `1px solid ${LINE}` }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: MUTED, textTransform: 'uppercase' }}>
        View
      </div>
      <RoleToggle role={role} setRole={setRole} region={region} setRegion={setRegion} />
    </div>
  );
}

// -------------------- NATIONAL --------------------

function NationalSwagger() {
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
      <section style={{ position: 'relative', padding: '56px 32px 24px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 48, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 820 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.3em', color: SUN, textTransform: 'uppercase', marginBottom: 20 }}>
              Floor report &middot; {snap.asOf}
            </div>
            <h1
              style={{
                fontFamily: DISPLAY,
                fontSize: 'clamp(68px, 11vw, 160px)',
                lineHeight: 0.86,
                letterSpacing: '-0.03em',
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              Own<br />the<br /><span style={{ color: SUN }}>floor.</span>
            </h1>
            <p style={{ marginTop: 24, maxWidth: 540, fontSize: 16, lineHeight: 1.5, color: SUBTLE }}>
              Where every region stands this morning. One screen, one answer. Tap a tab.
            </p>
          </div>
          <HeroStats k={snap.kpis} />
        </div>
      </section>

      <section style={{ padding: '24px 32px 16px', maxWidth: 1400, margin: '0 auto' }}>
        <OpsTabBar theme={SWAGGER_THEME} tabs={tabs} active={tab} onChange={(k) => setTab(k as typeof tab)} />
      </section>

      <section style={{ padding: '24px 32px 72px', maxWidth: 1400, margin: '0 auto' }}>
        {tab === 'people' && <OpsChannelStrip theme={SWAGGER_THEME} channel={snap.channel} />}
        {tab === 'winners' && (
          <>
            <LeaderboardCaveat theme={SWAGGER_THEME} />
            <OpsLeaderboards theme={SWAGGER_THEME} leaderboards={snap.leaderboards} />
          </>
        )}
        {tab === 'teams' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {pacing.map(r => <TeamCard key={`${r.region}-${r.team}`} r={r} />)}
          </div>
        )}
        {tab === 'scorecard' && <Scorecard theme={SWAGGER_THEME} region={null} limit={25} />}
      </section>
    </>
  );
}

// -------------------- REGIONAL --------------------

function RegionalSwagger({ region }: { region: string }) {
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
      <section style={{ position: 'relative', padding: '56px 32px 24px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.3em', color: SUN, textTransform: 'uppercase', marginBottom: 20 }}>
          {region} report &middot; {snap.asOf}
        </div>
        <h1
          style={{
            fontFamily: DISPLAY,
            fontSize: 'clamp(60px, 10vw, 140px)',
            lineHeight: 0.88,
            letterSpacing: '-0.03em',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          <span style={{ color: SUN }}>{region}</span><br />this morning.
        </h1>
        <p style={{ marginTop: 24, maxWidth: 620, fontSize: 16, lineHeight: 1.5, color: SUBTLE }}>
          Tap a tab. Everything on this screen is a decision you can make before coffee.
        </p>
      </section>

      <section style={{ padding: '24px 32px 16px', maxWidth: 1400, margin: '0 auto' }}>
        <RegionalTopline theme={SWAGGER_THEME} snapshot={snap} />
      </section>

      <section style={{ padding: '20px 32px 0', maxWidth: 1400, margin: '0 auto' }}>
        <OpsTabBar theme={SWAGGER_THEME} tabs={tabs} active={tab} onChange={(k) => setTab(k as typeof tab)} />
      </section>

      <section style={{ padding: '28px 32px 72px', maxWidth: 1400, margin: '0 auto' }}>
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

// -------------------- CHROME --------------------

function GrainOverlay() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background:
          'radial-gradient(ellipse at top left, rgba(250,109,29,0.08), transparent 55%),' +
          'radial-gradient(ellipse at bottom right, rgba(250,109,29,0.04), transparent 60%)',
        zIndex: 0,
      }}
    />
  );
}

function TopBar({
  role, setRole, region, setRegion, onLogout,
}: {
  role: Role; setRole: (r: Role) => void; region: string; setRegion: (r: string) => void; onLogout: () => void;
}) {
  return (
    <header style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ display: 'inline-block', width: 14, height: 14, background: SUN }} />
        <span style={{ fontFamily: DISPLAY, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          SunPower<sup style={{ fontSize: 9 }}>&reg;</sup> / Sales Ops
        </span>
      </div>
      <div style={{ flex: 1 }} />
      <RoleToggle role={role} setRole={setRole} region={region} setRegion={setRegion} />
      <button
        onClick={onLogout}
        style={{ background: 'transparent', border: `1px solid ${LINE_HI}`, color: MUTED, padding: '10px 14px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', cursor: 'pointer', marginLeft: 10 }}
      >
        Lock
      </button>
    </header>
  );
}

function RoleToggle({ role, setRole, region, setRegion }: { role: Role; setRole: (r: Role) => void; region: string; setRegion: (r: string) => void }) {
  const base: React.CSSProperties = {
    padding: '10px 16px',
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    border: `1px solid ${LINE_HI}`,
    background: 'transparent',
    color: MUTED,
  };
  const active: React.CSSProperties = { background: SUN, color: INK, borderColor: SUN };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      <button onClick={() => setRole('exec')} style={{ ...base, ...(role === 'exec' ? active : {}), borderRight: 'none' }}>National</button>
      <button onClick={() => setRole('regional')} style={{ ...base, ...(role === 'regional' ? active : {}) }}>Regional</button>
      {role === 'regional' && (
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={{ marginLeft: 10, background: 'transparent', color: TEXT, border: `1px solid ${LINE_HI}`, padding: '10px 10px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}
        >
          {REGIONS.map(r => <option key={r} value={r} style={{ background: SURFACE }}>{r}</option>)}
        </select>
      )}
    </div>
  );
}

function HeroStats({ k }: { k: ReturnType<typeof buildSnapshot>['kpis'] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', columnGap: 56, rowGap: 24, position: 'relative', zIndex: 1 }}>
      <HeroStat label="Bookings MTD" value={k.bookingsMtd.toLocaleString()} delta={k.bookingsDeltaPct} />
      <HeroStat label="Installs MTD" value={k.installsMtd.toLocaleString()} delta={k.installsDeltaPct} />
      <HeroStat label="Pull-through" value={`${k.pullThroughPct}%`} delta={k.pullThroughDeltaPct} />
      <HeroStat label="Cycle time" value={`${k.cycleDays}d`} />
    </div>
  );
}

function HeroStat({ label, value, delta }: { label: string; value: string; delta?: number }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: MUTED, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 44, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      {delta != null && (
        <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', color: delta >= 0 ? GOOD : BEHIND }}>
          {delta >= 0 ? '+' : ''}{delta}% MoM
        </div>
      )}
    </div>
  );
}

function TeamCard({ r }: { r: PacingRow }) {
  const status = r.pct >= 95 ? 'good' : r.pct >= 80 ? 'watch' : 'behind';
  const color = status === 'good' ? GOOD : status === 'watch' ? WATCH : BEHIND;
  const barPct = Math.min(100, Math.max(0, r.pct));
  return (
    <div style={{ background: SURFACE, border: `1px solid ${LINE}`, padding: '20px 22px' }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>
        {r.region}
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 22, lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: 18, textTransform: 'uppercase' }}>
        {r.team}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: MUTED, textTransform: 'uppercase' }}>Pacing</span>
        <span style={{ fontFamily: DISPLAY, fontSize: 28, lineHeight: 1, color }}>{r.pct}%</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${barPct}%`, background: color, transition: 'width 400ms ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: SUBTLE }}>
        <span>Target {r.targetMtd}</span>
        <span>Actual {r.actualMtd}</span>
      </div>
    </div>
  );
}

function NextRow() {
  return (
    <section style={{ position: 'relative', padding: '0 32px 72px', maxWidth: 1400, margin: '0 auto', zIndex: 1 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.3em', color: SUN, textTransform: 'uppercase', marginBottom: 14 }}>
        Next
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <NextCard href="/sales-ops/resources" title="Resource guide" cta="Open" />
        <NextCard href="/sales-ops/feedback" title="Ask or request" cta="Open" />
        <NextCard href="#" title="Install speed map" cta="Soon" disabled />
        <NextCard href="#" title="Geo allocation" cta="Soon" disabled />
      </div>
    </section>
  );
}

function NextCard({ href, title, cta, disabled }: { href: string; title: string; cta: string; disabled?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover && !disabled ? SURFACE_HI : SURFACE,
        padding: '28px 24px 24px',
        textDecoration: 'none',
        color: disabled ? MUTED : TEXT,
        display: 'block',
        pointerEvents: disabled ? 'none' : 'auto',
        border: `1px solid ${hover && !disabled ? SUN : LINE}`,
        transition: 'all 160ms ease',
      }}
    >
      <div style={{ fontFamily: DISPLAY, fontSize: 24, lineHeight: 1.1, letterSpacing: '-0.01em', textTransform: 'uppercase', marginBottom: 18 }}>
        {title}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: disabled ? MUTED : SUN, textTransform: 'uppercase' }}>
        {cta} {!disabled && '\u2192'}
      </div>
    </a>
  );
}

function Footer() {
  return (
    <footer
      style={{
        position: 'relative',
        padding: '24px 32px',
        borderTop: `1px solid ${LINE}`,
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: '#575a62',
        zIndex: 1,
      }}
    >
      <span>SunPower&reg; / Sales Ops / Beta</span>
      <span>Confidential</span>
    </footer>
  );
}
