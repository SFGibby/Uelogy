'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { REGIONS } from '../../lib/sales-ops/fake-ops-data';

const SANS = 'Arial, Helvetica, sans-serif';
const MONO = 'ui-monospace, Menlo, Consolas, monospace';

const INK = '#162241';
const SURFACE = '#1A2648';
const SURFACE_HI = '#1D2C55';
const LINE = '#26355f';
const LINE_HI = '#33436e';
const TEXT = '#ffffff';
const TEXT_SOFT = '#e6e9f0';
const MUTED = '#9aa3b5';
const SUN = '#FAD646';

// Static searchable registry. Reps are the illustrative names used in the fake
// data; teams come from the merdeka roster; resources are the tabs on the
// Finance Resource Guide.
const REPS: string[] = [
  'Jules Lyusya', 'Jay Farrell', 'Blayne Meyer', 'Nate Battles', 'Julian Maytorena',
  'Jordan Roberts', 'Tarrie French', 'Cage Matthews', 'Adam Larue', 'Justin Clayton',
  'Nicolas Knight', 'Omar Soliman', 'Omar Ahmed', 'Kellen Rose', 'Caleb Bacon',
  'Izz Issa', 'Lukas Yagi', 'Megan Thomason', 'Kyle Thomson', 'Michael Barrett',
  'Timothy Chung', 'James Arthur', 'Trent Dawson', 'Marco Vellis', 'Hunter Zeaman',
  'Daniel Parsons', 'Teak Barbour', 'Preston Vale', 'Carter Hall', 'Noah Shin',
];

const TEAMS: { team: string; region: string }[] = [
  { team: 'The Sunny D (MI)', region: 'Blue Raven' },
  { team: 'Shockwave (Wilmington)', region: 'Blue Raven' },
  { team: 'Raleighwood (NC)', region: 'Blue Raven' },
  { team: 'AbsoluT (CO)', region: 'Blue Raven' },
  { team: 'EXODUS (NV/OR)', region: 'Movement' },
  { team: 'X Pros', region: 'Movement' },
  { team: 'Philly', region: 'Movement' },
  { team: 'Bend (OR)', region: 'Movement' },
  { team: 'Summit (OR)', region: 'Movement' },
  { team: 'RTL (OR)', region: 'Movement' },
  { team: 'CTRL', region: 'Solar\u2019s Dead' },
  { team: 'AEROTYNE', region: 'Solar\u2019s Dead' },
  { team: 'Gldn', region: 'Precision' },
];

const RESOURCES: { label: string; tab: string }[] = [
  { label: 'Contact Guide', tab: 'sales' },
  { label: 'Finance Resource Guide', tab: 'finance' },
  { label: 'Financing Calculator', tab: 'calc' },
  { label: 'Adders Guide', tab: 'adders' },
  { label: 'Equipment Guide', tab: 'equipment' },
  { label: 'FAQs', tab: 'faqs' },
];

interface Result {
  key: string;
  kind: 'rep' | 'team' | 'region' | 'resource' | 'surface';
  label: string;
  context?: string;
  href: string;
}

const SURFACES: Result[] = [
  { key: 'surface-map', kind: 'surface', label: 'Install speed map', href: '/sales-ops/map' },
  { key: 'surface-pulse', kind: 'surface', label: 'Pulse', href: '/sales-ops/pulse' },
  { key: 'surface-resources', kind: 'surface', label: 'Resource guide', href: '/sales-ops/resources' },
];

function buildIndex(): Result[] {
  const items: Result[] = [...SURFACES];

  for (const r of REPS) {
    items.push({
      key: `rep-${r}`,
      kind: 'rep',
      label: r,
      context: 'Rep scorecard',
      href: `/sales-ops/pulse?view=regional&tab=scorecard&q=${encodeURIComponent(r)}`,
    });
  }
  for (const t of TEAMS) {
    items.push({
      key: `team-${t.team}`,
      kind: 'team',
      label: t.team,
      context: `${t.region} \u00b7 team`,
      href: `/sales-ops/pulse?view=regional&region=${encodeURIComponent(t.region)}&tab=scorecard&q=${encodeURIComponent(t.team)}`,
    });
  }
  for (const reg of REGIONS) {
    items.push({
      key: `region-${reg}`,
      kind: 'region',
      label: reg,
      context: 'Region',
      href: `/sales-ops/pulse?view=regional&region=${encodeURIComponent(reg)}`,
    });
  }
  for (const r of RESOURCES) {
    items.push({
      key: `res-${r.tab}`,
      kind: 'resource',
      label: r.label,
      context: 'Resource guide',
      href: `/sales-ops/resources?tab=${r.tab}`,
    });
  }
  return items;
}

const INDEX = buildIndex();

export default function UniversalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return INDEX
      .filter(i => i.label.toLowerCase().includes(q) || i.context?.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => { setCursor(0); }, [query]);

  function go(r: Result) {
    router.push(r.href);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter' && results[cursor]) { e.preventDefault(); go(results[cursor]); }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1, maxWidth: 440 }}>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search reps, teams, resources\u2026"
        style={{
          width: '100%',
          padding: '8px 12px 8px 32px',
          background: SURFACE,
          color: TEXT,
          border: `1px solid ${LINE_HI}`,
          borderRadius: 4,
          outline: 'none',
          fontFamily: SANS,
          fontSize: 13,
          boxSizing: 'border-box',
        }}
      />
      <svg
        aria-hidden
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      >
        <circle cx="11" cy="11" r="7" stroke={MUTED} strokeWidth="2" />
        <path d="M21 21l-4.5-4.5" stroke={MUTED} strokeWidth="2" strokeLinecap="round" />
      </svg>
      {!query && (
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.06em', pointerEvents: 'none' }}>
          \u2318K
        </span>
      )}

      {open && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: SURFACE,
            border: `1px solid ${LINE_HI}`,
            borderRadius: 4,
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            zIndex: 60,
            overflow: 'hidden',
          }}
        >
          {results.map((r, i) => {
            const active = i === cursor;
            return (
              <button
                key={r.key}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(r)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '72px 1fr auto',
                  gap: 12,
                  width: '100%',
                  padding: '10px 12px',
                  textAlign: 'left',
                  background: active ? SURFACE_HI : 'transparent',
                  color: TEXT_SOFT,
                  border: 0,
                  borderTop: i === 0 ? 0 : `1px solid ${LINE}`,
                  cursor: 'pointer',
                  fontFamily: SANS,
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', color: SUN, textTransform: 'uppercase' }}>
                  {r.kind}
                </span>
                <span style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{r.label}</span>
                {r.context && (
                  <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>{r.context}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {open && query.trim() && results.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: SURFACE,
            border: `1px solid ${LINE_HI}`,
            borderRadius: 4,
            padding: '14px 16px',
            fontFamily: SANS,
            fontSize: 12,
            color: MUTED,
            zIndex: 60,
          }}
        >
          No matches for &ldquo;{query}&rdquo;.
        </div>
      )}
    </div>
  );
}
