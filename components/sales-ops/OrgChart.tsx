'use client';

import { useEffect, useMemo, useState } from 'react';

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
const BEHIND = '#FF5E7A';

const DISPLAY = 'var(--font-gibson-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';
const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';

type Team = {
  team: string;
  dm_name: string;
  dm_phone: string;
  dm_note?: string;
  status: string;
  metro: string;
  state: string;
};
type Region = { name: string; teams: Team[] };
type Regional = { name: string; phone: string; full_name?: string; regions: Region[] };
type Division = { name: string; regionals: Regional[] };
type OrgData = { divisions: Division[]; team_count: number; spocs: Array<Record<string, string>>; generated_at: string };

function matches(q: string, ...vals: Array<string | undefined>): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return vals.some(v => (v || '').toLowerCase().includes(needle));
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('active')) return GOOD;
  if (s.includes('inactive') || s.includes('terminated') || s.includes('retired')) return BEHIND;
  if (s.includes('pending') || s.includes('training')) return SUN;
  return MUTED;
}

function TeamRow({ t, query }: { t: Team; query: string }) {
  const [open, setOpen] = useState(false);
  const hit = matches(query, t.team, t.dm_name, t.metro, t.state, t.status);
  if (!hit) return null;
  return (
    <div
      style={{
        padding: '10px 14px',
        borderTop: `1px solid ${LINE}`,
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        alignItems: 'center',
        gap: 12,
        background: open ? SURFACE_HI : 'transparent',
        cursor: 'pointer',
      }}
      onClick={() => setOpen(v => !v)}
    >
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: 14, textTransform: 'uppercase', letterSpacing: '-0.01em', color: TEXT }}>
          {t.team || '—'}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase', marginTop: 2 }}>
          {[t.metro, t.state].filter(Boolean).join(' · ') || '—'}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: SANS, fontSize: 13, color: SUBTLE }}>{t.dm_name || '—'}</div>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: MUTED, marginTop: 2 }}>
          {t.dm_phone || ''}
        </div>
      </div>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          color: statusColor(t.status),
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${LINE_HI}`,
          borderRadius: 999,
          padding: '3px 8px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {t.status || 'n/a'}
      </span>
      {open && t.dm_note ? (
        <div style={{ gridColumn: '1 / -1', fontSize: 12, color: SUBTLE, paddingTop: 4 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase', marginRight: 8 }}>
            Note
          </span>
          {t.dm_note}
        </div>
      ) : null}
    </div>
  );
}

function RegionBlock({ r, query, defaultOpen }: { r: Region; query: string; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const visibleTeams = r.teams.filter(t => matches(query, t.team, t.dm_name, t.metro, t.state, t.status, r.name));
  if (query && visibleTeams.length === 0) return null;

  return (
    <div style={{ marginTop: 10, border: `1px solid ${LINE_HI}`, borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          background: SURFACE,
          color: TEXT,
          border: 0,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontFamily: DISPLAY,
          fontSize: 16,
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
        }}
      >
        <span>{r.name}</span>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: MUTED }}>
          {visibleTeams.length} {visibleTeams.length === 1 ? 'TEAM' : 'TEAMS'} {open ? '▾' : '▸'}
        </span>
      </button>
      {open && visibleTeams.map((t, i) => <TeamRow key={`${r.name}-${t.team}-${i}`} t={t} query={query} />)}
    </div>
  );
}

function RegionalBlock({ g, query, defaultOpen }: { g: Regional; query: string; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const totalTeams = g.regions.reduce((n, r) => n + r.teams.length, 0);
  const visibleCount = g.regions.reduce(
    (n, r) => n + r.teams.filter(t => matches(query, t.team, t.dm_name, t.metro, t.state, t.status, r.name, g.name, g.full_name)).length,
    0
  );
  if (query && visibleCount === 0) return null;

  return (
    <div style={{ background: SURFACE, border: `1px solid ${LINE_HI}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 0,
          color: TEXT,
          textAlign: 'left',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: SUN, textTransform: 'uppercase' }}>
            Regional
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 24, textTransform: 'uppercase', letterSpacing: '-0.01em', marginTop: 4 }}>
            {g.full_name || g.name}
          </div>
          {g.full_name ? (
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase', marginTop: 2 }}>
              {g.name}
            </div>
          ) : null}
          {g.phone ? (
            <div style={{ fontFamily: MONO, fontSize: 11, color: SUBTLE, marginTop: 6 }}>
              <a href={`tel:${g.phone.replace(/\D/g, '')}`} style={{ color: SUBTLE, textDecoration: 'none', borderBottom: `1px dotted ${LINE_HI}` }}>
                {g.phone}
              </a>
            </div>
          ) : null}
        </div>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: MUTED }}>
          {query ? `${visibleCount}/${totalTeams}` : totalTeams} TEAMS {open ? '▾' : '▸'}
        </span>
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          {g.regions.map(r => (
            <RegionBlock key={`${g.name}-${r.name}`} r={r} query={query} defaultOpen={!!query} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const [data, setData] = useState<OrgData | null>(null);
  const [query, setQuery] = useState('');
  const [division, setDivision] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');

  useEffect(() => {
    fetch('/sales-ops/data/org-chart.json')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null));
  }, []);

  const divisions = useMemo(() => {
    if (!data) return [];
    const picked = division === 'ALL' ? data.divisions : data.divisions.filter(d => d.name === division);
    if (status === 'ALL') return picked;
    return picked
      .map(d => ({
        ...d,
        regionals: d.regionals
          .map(g => ({
            ...g,
            regions: g.regions
              .map(r => ({ ...r, teams: r.teams.filter(t => t.status.toLowerCase() === status.toLowerCase()) }))
              .filter(r => r.teams.length > 0),
          }))
          .filter(g => g.regions.length > 0),
      }))
      .filter(d => d.regionals.length > 0);
  }, [data, division, status]);

  const statuses = useMemo(() => {
    if (!data) return [];
    const s = new Set<string>();
    data.divisions.forEach(d =>
      d.regionals.forEach(g => g.regions.forEach(r => r.teams.forEach(t => t.status && s.add(t.status))))
    );
    return Array.from(s).sort();
  }, [data]);

  const totals = useMemo(() => {
    let regionals = 0, regions = 0, teams = 0;
    divisions.forEach(d => {
      regionals += d.regionals.length;
      d.regionals.forEach(g => {
        regions += g.regions.length;
        g.regions.forEach(r => { teams += r.teams.length; });
      });
    });
    return { regionals, regions, teams };
  }, [divisions]);

  if (!data) {
    return (
      <div style={{ padding: 40, color: MUTED, fontFamily: MONO, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        Loading org chart...
      </div>
    );
  }

  return (
    <div style={{ background: INK, minHeight: '100vh', padding: '28px 32px 80px', fontFamily: SANS }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: SUN, textTransform: 'uppercase' }}>
          Direct · Rep org
        </div>
        <h1
          style={{
            fontFamily: DISPLAY,
            fontSize: 'clamp(44px, 7vw, 72px)',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            lineHeight: 0.95,
            margin: '10px 0 6px',
          }}
        >
          Org <span style={{ color: SUN }}>Chart</span>
        </h1>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase' }}>
          {totals.teams} teams · {totals.regions} regions · {totals.regionals} regionals · generated {data.generated_at}
        </div>

        <div
          style={{
            marginTop: 22,
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            alignItems: 'center',
            background: SURFACE,
            border: `1px solid ${LINE_HI}`,
            borderRadius: 12,
            padding: '14px 18px',
          }}
        >
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search team, DM, metro, state"
            style={{
              flex: '1 1 220px',
              minWidth: 220,
              background: 'transparent',
              border: `1px solid ${LINE_HI}`,
              borderRadius: 999,
              color: TEXT,
              padding: '9px 14px',
              fontFamily: SANS,
              fontSize: 13,
              outline: 'none',
            }}
          />
          <FilterPills
            label="Division"
            value={division}
            options={['ALL', ...data.divisions.map(d => d.name)]}
            onChange={setDivision}
          />
          <FilterPills
            label="Status"
            value={status}
            options={['ALL', ...statuses]}
            onChange={setStatus}
          />
        </div>

        <div style={{ marginTop: 26 }}>
          {divisions.length === 0 ? (
            <div style={{ color: MUTED, fontFamily: MONO, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              No teams match.
            </div>
          ) : (
            divisions.map(d => (
              <section key={d.name} style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      fontFamily: DISPLAY,
                      fontSize: 32,
                      textTransform: 'uppercase',
                      letterSpacing: '-0.02em',
                      color: TEXT,
                    }}
                  >
                    {d.name}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: MUTED, textTransform: 'uppercase' }}>
                    {d.regionals.length} {d.regionals.length === 1 ? 'Regional' : 'Regionals'}
                  </div>
                </div>
                {d.regionals.map(g => (
                  <RegionalBlock key={`${d.name}-${g.name}`} g={g} query={query} defaultOpen={!!query || d.regionals.length <= 2} />
                ))}
              </section>
            ))
          )}
        </div>

        {data.spocs && data.spocs.length > 0 ? (
          <SpocPanel spocs={data.spocs} query={query} />
        ) : null}
      </div>
    </div>
  );
}

function FilterPills({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: MUTED, textTransform: 'uppercase' }}>
        {label}
      </span>
      <div
        style={{
          display: 'inline-flex',
          background: SURFACE,
          border: `1px solid ${LINE_HI}`,
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        {options.map(o => {
          const active = o === value;
          return (
            <button
              key={o}
              onClick={() => onChange(o)}
              aria-pressed={active}
              style={{
                padding: '7px 14px',
                background: active ? SUN : 'transparent',
                color: active ? INK : SUBTLE,
                border: 0,
                cursor: 'pointer',
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SpocPanel({ spocs, query }: { spocs: Array<Record<string, string>>; query: string }) {
  const filtered = spocs.filter(s => matches(query, s.team, s.contact, s.city, s.state, s.zip));
  if (filtered.length === 0) return null;
  return (
    <section style={{ marginTop: 48 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: SUN, textTransform: 'uppercase' }}>
        SPOC · Shipping Points
      </div>
      <h2 style={{ fontFamily: DISPLAY, fontSize: 28, textTransform: 'uppercase', letterSpacing: '-0.01em', margin: '8px 0 14px' }}>
        Team Addresses
      </h2>
      <div style={{ background: SURFACE, border: `1px solid ${LINE_HI}`, borderRadius: 12, overflow: 'hidden' }}>
        {filtered.map((s, i) => (
          <div
            key={`${s.team}-${i}`}
            style={{
              padding: '12px 16px',
              borderTop: i === 0 ? 0 : `1px solid ${LINE}`,
              display: 'grid',
              gridTemplateColumns: '1.1fr 1fr 1.3fr',
              gap: 12,
              alignItems: 'baseline',
            }}
          >
            <div>
              <div style={{ fontFamily: DISPLAY, fontSize: 14, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{s.team || '—'}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase', marginTop: 2 }}>
                {s.contact || ''}
              </div>
            </div>
            <div style={{ fontSize: 13, color: SUBTLE }}>
              {s.address}
              {s.address_2 ? `, ${s.address_2}` : ''}
            </div>
            <div style={{ fontSize: 13, color: SUBTLE }}>
              {[s.city, s.state, s.zip].filter(Boolean).join(', ')}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
