'use client';

// Shared content blocks each hub vibe can render.
// Each block takes a `theme` so it inherits the host hub's design tokens
// (fonts, colors) and reads consistent across editorial / swagger / records / etc.

import type {
  ChannelHealth, Leaderboard, SlaCard,
  CallListItem, FunnelStage, PacingRow, RepCard, StuckDeal, RepStatus,
} from '../../lib/sales-ops/fake-ops-data';

export interface SharedTheme {
  sans: string;
  display?: string;
  serif?: string;
  mono: string;
  ink: string;
  text: string;
  muted: string;
  subtle: string;
  line: string;
  accent: string;
  good: string;
  watch: string;
  behind: string;
  surface?: string;
}

function toneColor(theme: SharedTheme, tone: ChannelHealth['tone']): string {
  if (tone === 'good') return theme.good;
  if (tone === 'watch') return theme.watch;
  if (tone === 'behind') return theme.behind;
  return theme.subtle;
}

function slaColor(theme: SharedTheme, status: SlaCard['status']): string {
  return status === 'on-pace' ? theme.good : status === 'watch' ? theme.watch : theme.behind;
}

/** Sales experience strip — pull-through, recruiting, onboarding, deactivations. */
export function OpsChannelStrip({ theme, channel }: { theme: SharedTheme; channel: ChannelHealth[] }) {
  const display = theme.display ?? theme.serif ?? theme.sans;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
      {channel.map(c => {
        const color = toneColor(theme, c.tone);
        return (
          <div key={c.label} style={{ borderLeft: `2px solid ${color}`, paddingLeft: 14 }}>
            <div style={{ fontFamily: theme.mono, fontSize: 10, letterSpacing: '0.22em', color: theme.muted, textTransform: 'uppercase', marginBottom: 10 }}>
              {c.label}
            </div>
            <div style={{ fontFamily: display, fontSize: 30, lineHeight: 1, color: theme.text, fontWeight: 500 }}>
              {c.value}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color, lineHeight: 1.4 }}>
              {c.delta}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** All ops department SLAs, grouped by department. */
export function OpsSlaGrid({ theme, sla }: { theme: SharedTheme; sla: SlaCard[] }) {
  const display = theme.display ?? theme.serif ?? theme.sans;
  const groups: Record<string, SlaCard[]> = {};
  for (const s of sla) (groups[s.department] = groups[s.department] ?? []).push(s);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 32, rowGap: 28 }}>
      {Object.entries(groups).map(([dept, items]) => (
        <div key={dept}>
          <div style={{ fontFamily: display, fontSize: 20, color: theme.text, marginBottom: 2 }}>
            {dept}
          </div>
          <div style={{ height: 1, background: theme.line, marginBottom: 12 }} />
          {items.map(item => {
            const color = slaColor(theme, item.status);
            const label = item.status === 'on-pace' ? 'Holding' : item.status === 'watch' ? 'Watch' : 'Behind';
            return (
              <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '1fr auto', columnGap: 14, padding: '10px 0', borderBottom: `1px dashed ${theme.line}` }}>
                <div>
                  <div style={{ fontFamily: theme.sans, fontSize: 13, color: theme.text, marginBottom: 2 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: theme.mono, fontSize: 11, letterSpacing: '0.08em', color: theme.muted }}>
                    {item.targetLabel}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: display, fontSize: 18, lineHeight: 1, color: theme.text }}>
                    {item.value}
                  </div>
                  <div style={{ marginTop: 4, fontFamily: theme.mono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color }}>
                    {label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Four top-performer leaderboards. */
export function OpsLeaderboards({ theme, leaderboards }: { theme: SharedTheme; leaderboards: Leaderboard[] }) {
  const display = theme.display ?? theme.serif ?? theme.sans;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: 48, rowGap: 36 }}>
      {leaderboards.map(lb => (
        <div key={lb.title}>
          <div style={{ fontFamily: display, fontSize: 24, fontWeight: 500, letterSpacing: '-0.005em', color: theme.text, marginBottom: 2 }}>
            {lb.title}
          </div>
          <div style={{ fontFamily: theme.sans, fontSize: 13, color: theme.subtle, marginBottom: 14 }}>
            {lb.subtitle}
          </div>
          <div>
            {lb.rows.map((r, i) => (
              <div
                key={`${lb.title}-${i}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr auto',
                  columnGap: 10,
                  alignItems: 'baseline',
                  padding: '10px 0',
                  borderTop: `1px solid ${theme.line}`,
                }}
              >
                <div style={{ fontFamily: theme.mono, fontSize: 11, letterSpacing: '0.14em', color: theme.muted }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <div style={{ fontFamily: theme.sans, fontSize: 14, color: theme.text, fontWeight: 500 }}>
                    {r.name}
                  </div>
                  <div style={{ fontFamily: theme.mono, fontSize: 11, letterSpacing: '0.06em', color: theme.muted, marginTop: 2 }}>
                    {r.region} &middot; {r.team}
                  </div>
                </div>
                <div style={{ fontFamily: display, fontSize: 18, color: theme.text, textAlign: 'right' }}>
                  {r.valueLabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Standalone caveat line for the leaderboards section. */
export function LeaderboardCaveat({ theme }: { theme: SharedTheme }) {
  return (
    <p style={{ fontFamily: theme.sans, fontSize: 13, color: theme.subtle, maxWidth: 760, marginTop: 0, marginBottom: 20, fontStyle: 'italic' }}>
      Rep names here are illustrative; the real roll-up will pull from Enerflo + Salesforce.
    </p>
  );
}

// --------------------------------------------------------------------------
// Regional-view blocks. These compose into an action-forward layout for a
// regional manager looking at only their region.
// --------------------------------------------------------------------------

function toneForCall(tone: CallListItem['tone'], theme: SharedTheme): string {
  if (tone === 'congratulate') return theme.good;
  if (tone === 'intervene') return theme.behind;
  return theme.watch;
}

function labelForCall(tone: CallListItem['tone']): string {
  if (tone === 'congratulate') return 'Congratulate';
  if (tone === 'intervene') return 'Intervene';
  return 'Coach';
}

function statusColor(status: RepStatus, theme: SharedTheme): string {
  if (status === 'hot') return theme.good;
  if (status === 'steady') return theme.subtle;
  if (status === 'cooling') return theme.watch;
  return theme.behind;
}

function statusLabel(status: RepStatus): string {
  if (status === 'hot') return 'Hot';
  if (status === 'steady') return 'Steady';
  if (status === 'cooling') return 'Cooling';
  return 'Flight risk';
}

/** This morning, call. The action tray. */
export function RegionalCallList({ theme, items }: { theme: SharedTheme; items: CallListItem[] }) {
  const display = theme.display ?? theme.serif ?? theme.sans;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
      {items.map((it, i) => {
        const color = toneForCall(it.tone, theme);
        return (
          <div
            key={i}
            style={{
              border: `1px solid ${theme.line}`,
              borderLeft: `4px solid ${color}`,
              padding: '18px 20px',
              background: theme.surface ?? 'transparent',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ fontFamily: theme.mono, fontSize: 10, letterSpacing: '0.22em', color, textTransform: 'uppercase' }}>
                {labelForCall(it.tone)}
              </span>
              <span style={{ fontFamily: theme.mono, fontSize: 10, letterSpacing: '0.18em', color: theme.muted, textTransform: 'uppercase' }}>
                {it.context}
              </span>
            </div>
            <div style={{ fontFamily: display, fontSize: 24, lineHeight: 1.15, letterSpacing: '-0.005em', color: theme.text, marginBottom: 6 }}>
              {it.who}
            </div>
            <div style={{ fontFamily: theme.sans, fontSize: 13, color: theme.subtle, lineHeight: 1.5, marginBottom: 10 }}>
              {it.why}
            </div>
            <div style={{ fontFamily: theme.sans, fontSize: 13, color: theme.text, lineHeight: 1.5 }}>
              <span style={{ fontFamily: theme.mono, fontSize: 10, letterSpacing: '0.14em', color: theme.muted, textTransform: 'uppercase', marginRight: 8 }}>Action</span>
              {it.action}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Where my region's deals drop between booking and PTO. */
export function PullThroughFunnel({ theme, funnel, pullThroughPct }: { theme: SharedTheme; funnel: FunnelStage[]; pullThroughPct: number }) {
  const display = theme.display ?? theme.serif ?? theme.sans;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginBottom: 20 }}>
        <div style={{ fontFamily: display, fontSize: 48, lineHeight: 1, color: theme.text }}>
          {pullThroughPct}%
        </div>
        <div style={{ fontFamily: theme.mono, fontSize: 11, letterSpacing: '0.22em', color: theme.muted, textTransform: 'uppercase', maxWidth: 320, lineHeight: 1.5 }}>
          overall pull-through for this region. The ladder below shows where deals drop.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
        {funnel.map(f => {
          const tone = f.rate >= 95 ? theme.good : f.rate >= 90 ? theme.watch : theme.behind;
          const barPct = Math.min(100, Math.max(0, f.rate));
          return (
            <div key={f.label} style={{ display: 'grid', gridTemplateColumns: '220px 1fr auto auto', columnGap: 16, alignItems: 'center' }}>
              <div style={{ fontFamily: theme.sans, fontSize: 14, color: theme.text }}>{f.label}</div>
              <div style={{ height: 10, background: theme.line, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, width: `${barPct}%`, background: tone }} />
              </div>
              <div style={{ fontFamily: theme.mono, fontSize: 13, color: theme.text, textAlign: 'right', minWidth: 46 }}>
                {f.rate}%
              </div>
              <div style={{ fontFamily: theme.mono, fontSize: 11, letterSpacing: '0.1em', color: theme.muted, textTransform: 'uppercase', minWidth: 110, textAlign: 'right' }}>
                {f.droppedCount} dropped {'\u00b7'} {f.medianDays}d
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Teams in my region with coaching chip. */
export function TeamCoachList({ theme, rows }: { theme: SharedTheme; rows: PacingRow[] }) {
  const display = theme.display ?? theme.serif ?? theme.sans;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
      {rows.map(r => {
        const status = r.pct >= 95 ? 'good' : r.pct >= 80 ? 'watch' : 'behind';
        const color = status === 'good' ? theme.good : status === 'watch' ? theme.watch : theme.behind;
        const action = status === 'good' ? 'Call to congratulate' : status === 'watch' ? 'Mid-week check-in' : 'Team huddle, reset';
        return (
          <div
            key={r.team}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto auto',
              columnGap: 20,
              alignItems: 'center',
              padding: '14px 18px',
              background: theme.surface ?? 'transparent',
              border: `1px solid ${theme.line}`,
              borderLeft: `3px solid ${color}`,
            }}
          >
            <div>
              <div style={{ fontFamily: display, fontSize: 18, lineHeight: 1.1, color: theme.text }}>{r.team}</div>
              <div style={{ fontFamily: theme.mono, fontSize: 11, letterSpacing: '0.1em', color: theme.muted, marginTop: 4 }}>
                {r.actualMtd} of {r.targetMtd} bookings
              </div>
            </div>
            <div style={{ fontFamily: theme.mono, fontSize: 16, color }}>{r.pct}%</div>
            <div style={{ fontFamily: theme.mono, fontSize: 10, letterSpacing: '0.22em', color, textTransform: 'uppercase', padding: '4px 10px', border: `1px solid ${color}` }}>
              {status === 'good' ? 'Lead' : status === 'watch' ? 'Watch' : 'Behind'}
            </div>
            <div style={{ fontFamily: theme.sans, fontSize: 13, color: theme.subtle, minWidth: 220, textAlign: 'right' }}>
              {action}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** My reps, grouped by status. */
export function RepFlightList({ theme, reps }: { theme: SharedTheme; reps: RepCard[] }) {
  const display = theme.display ?? theme.serif ?? theme.sans;
  const groups: Record<RepStatus, RepCard[]> = { 'hot': [], 'steady': [], 'cooling': [], 'flight-risk': [] };
  for (const r of reps) groups[r.status].push(r);
  const order: RepStatus[] = ['hot', 'steady', 'cooling', 'flight-risk'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
      {order.map(st => {
        const color = statusColor(st, theme);
        return (
          <div key={st}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${theme.line}` }}>
              <span style={{ fontFamily: theme.mono, fontSize: 10, letterSpacing: '0.22em', color, textTransform: 'uppercase' }}>
                {statusLabel(st)}
              </span>
              <span style={{ fontFamily: theme.mono, fontSize: 11, color: theme.muted }}>
                {groups[st].length}
              </span>
            </div>
            {groups[st].length === 0 && (
              <div style={{ fontFamily: theme.sans, fontSize: 12, color: theme.muted, fontStyle: 'italic' }}>None.</div>
            )}
            {groups[st].map(r => (
              <div key={r.name} style={{ padding: '10px 0', borderBottom: `1px dashed ${theme.line}` }}>
                <div style={{ fontFamily: display, fontSize: 15, color: theme.text }}>{r.name}</div>
                <div style={{ fontFamily: theme.mono, fontSize: 11, letterSpacing: '0.06em', color: theme.muted, marginTop: 2 }}>
                  {r.team}
                </div>
                <div style={{ fontFamily: theme.sans, fontSize: 12, color: theme.subtle, marginTop: 6, lineHeight: 1.4 }}>
                  {r.reason}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** Deals red-flagged inside ops right now. Each row has a human to ping. */
export function StuckDealsBoard({ theme, deals }: { theme: SharedTheme; deals: StuckDeal[] }) {
  const display = theme.display ?? theme.serif ?? theme.sans;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
      {deals.map((d, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr auto 1fr auto',
            columnGap: 24,
            alignItems: 'center',
            padding: '14px 18px',
            background: theme.surface ?? 'transparent',
            border: `1px solid ${theme.line}`,
          }}
        >
          <div>
            <div style={{ fontFamily: display, fontSize: 15, color: theme.text }}>{d.customer}</div>
            <div style={{ fontFamily: theme.mono, fontSize: 11, letterSpacing: '0.08em', color: theme.muted, marginTop: 3 }}>
              {d.rep} {'\u00b7'} {d.team}
            </div>
          </div>
          <div style={{ fontFamily: theme.mono, fontSize: 12, letterSpacing: '0.12em', color: theme.subtle, textTransform: 'uppercase' }}>
            Stuck in {d.stage}
          </div>
          <div style={{ fontFamily: theme.mono, fontSize: 14, color: theme.behind, fontWeight: 600 }}>
            {d.daysStuck}d
          </div>
          <div>
            <div style={{ fontFamily: theme.sans, fontSize: 13, color: theme.text }}>Ping {d.owner}</div>
            <div style={{ fontFamily: theme.mono, fontSize: 10, letterSpacing: '0.14em', color: theme.muted, textTransform: 'uppercase', marginTop: 3 }}>
              {d.ownerRole}
            </div>
          </div>
          <div style={{ fontFamily: theme.mono, fontSize: 10, letterSpacing: '0.22em', color: theme.accent, textTransform: 'uppercase', border: `1px solid ${theme.accent}`, padding: '6px 10px' }}>
            Open
          </div>
        </div>
      ))}
    </div>
  );
}

/** Topline strip for a regional view: pull-through front-and-center. */
export function RegionalTopline({ theme, snapshot }: { theme: SharedTheme; snapshot: { bookingsMtd: number; bookingsTargetMtd: number; pacingPct: number; pullThroughPct: number; pullThroughDeltaPct: number; installsMtd: number; cycleDays: number; teamCount: number; repCount: number; region: string } }) {
  const display = theme.display ?? theme.serif ?? theme.sans;
  const pacingColor = snapshot.pacingPct >= 95 ? theme.good : snapshot.pacingPct >= 80 ? theme.watch : theme.behind;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, border: `1px solid ${theme.line}` }}>
      <CellCore theme={theme} label="Pull-through" value={`${snapshot.pullThroughPct}%`} note={`${snapshot.pullThroughDeltaPct >= 0 ? '+' : ''}${snapshot.pullThroughDeltaPct}% MoM`} tone={theme.accent} />
      <CellCore theme={theme} label="Bookings MTD" value={snapshot.bookingsMtd.toLocaleString()} note={`${snapshot.pacingPct}% of ${snapshot.bookingsTargetMtd} plan`} tone={pacingColor} />
      <CellCore theme={theme} label="Installs MTD" value={snapshot.installsMtd.toLocaleString()} note="Translated from bookings via pull-through" />
      <CellCore theme={theme} label="Avg cycle" value={`${snapshot.cycleDays}d`} note="Booking through install" />
      <CellCore theme={theme} label="Floor" value={`${snapshot.teamCount} teams`} note={`${snapshot.repCount} reps across ${snapshot.region}`} />
    </div>
  );
}

/** Tab bar — Enzy pattern. One view at a time. */
export interface OpsTab {
  key: string;
  label: string;
  count?: number | string;
}

export function OpsTabBar({ theme, tabs, active, onChange, dark = true }: { theme: SharedTheme; tabs: OpsTab[]; active: string; onChange: (key: string) => void; dark?: boolean }) {
  return (
    <div
      role="tablist"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
        border: `1px solid ${theme.line}`,
        background: theme.surface ?? 'transparent',
      }}
    >
      {tabs.map((t, i) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            style={{
              padding: '18px 14px',
              background: isActive ? theme.text : 'transparent',
              color: isActive ? theme.ink : theme.subtle,
              border: 'none',
              borderRight: i === tabs.length - 1 ? 'none' : `1px solid ${theme.line}`,
              cursor: 'pointer',
              textAlign: 'center',
              fontFamily: theme.sans,
              transition: 'background 160ms ease',
            }}
          >
            <div style={{ fontFamily: theme.mono, fontSize: 10, letterSpacing: '0.26em', textTransform: 'uppercase', marginBottom: 6 }}>
              {t.label}
            </div>
            {t.count != null && (
              <div style={{ fontFamily: theme.display ?? theme.serif ?? theme.sans, fontSize: 22, lineHeight: 1, fontWeight: 600 }}>
                {t.count}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function CellCore({ theme, label, value, note, tone }: { theme: SharedTheme; label: string; value: string; note: string; tone?: string }) {
  const display = theme.display ?? theme.serif ?? theme.sans;
  return (
    <div style={{ padding: '22px 22px 20px', borderRight: `1px solid ${theme.line}`, background: theme.surface ?? 'transparent' }}>
      <div style={{ fontFamily: theme.mono, fontSize: 10, letterSpacing: '0.22em', color: theme.muted, textTransform: 'uppercase', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: display, fontSize: 36, lineHeight: 1, color: tone ?? theme.text, letterSpacing: '-0.015em' }}>
        {value}
      </div>
      <div style={{ marginTop: 8, fontFamily: theme.mono, fontSize: 11, letterSpacing: '0.08em', color: theme.muted }}>
        {note}
      </div>
    </div>
  );
}
