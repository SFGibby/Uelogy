'use client';

import { useMemo, useState } from 'react';
import type { Agg, AggValue, FilterState, Zip3Meta, MetricKey } from './types';
import { getAgg, installCount, pickMetric } from './heat';
import { MIN, METRIC_INDEX } from './types';
import { useServiceableStates, useEnerfloCoverage } from './useMapData';

const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';
const DISPLAY = 'var(--font-gibson-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';

const SURFACE = '#171B38';
const LINE_HI = 'rgba(255,255,255,0.14)';
const TEXT = '#FFFFFF';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California', CO:'Colorado',
  CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia', HI:'Hawaii', ID:'Idaho',
  IL:'Illinois', IN:'Indiana', IA:'Iowa', KS:'Kansas', KY:'Kentucky', LA:'Louisiana',
  ME:'Maine', MD:'Maryland', MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi',
  MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey',
  NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio',
  OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina',
  SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont', VA:'Virginia',
  WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming', DC:'DC',
};

export type RailMode = 'speed' | 'workable';

interface Props {
  agg: Agg;
  zip3: Zip3Meta[];
  filter: FilterState;
  onSelectState: (abbr: string) => void;
  onSelectZip3?: (p: string | null) => void;
  onSelectEpc?: (epc: string | null, states: string[]) => void;
  hoverZip?: string | null;
  onHoverZip?: (p: string | null) => void;
  railMode?: RailMode;
  onRailMode?: (m: RailMode) => void;
}

interface Row {
  key: string;
  primary: string;
  secondary: string;
  epc?: string;      // "fastest EPC" credit, only populated on EPC channel
  value: number;
  count: number;
}

// Find the EPC inside a scope (state or ZIP3) that owns the best metric
// value under the current filter. "Best" is lowest median for time metrics,
// highest count for volume. Returns null when no EPC meets the install floor.
function bestEpcIn(
  agg: Agg,
  filter: FilterState,
  section: 'ES' | 'EZ',
  scopeKey: string,       // state abbr for ES, ZIP3 for EZ
): string | null {
  const metricIdx = METRIC_INDEX[filter.metric];
  const metricIsCount = filter.metric === 'n';
  const prefix = `${section}|${filter.window}|E|${filter.inc}|${scopeKey}|`;
  let bestName: string | null = null;
  let bestValue = metricIsCount ? -Infinity : Infinity;
  for (const key of Object.keys(agg)) {
    if (!key.startsWith(prefix)) continue;
    const parts = key.split('|');
    const epc = parts[5];
    if (!epc) continue;
    const row = agg[key];
    const n = installCount(row);
    if (n < 3) continue;    // too few installs to credit as "fastest"
    const v = row[metricIdx];
    if (typeof v !== 'number') continue;
    const score = metricIsCount ? n : v;
    if (metricIsCount ? score > bestValue : score < bestValue) {
      bestValue = score;
      bestName = epc;
    }
  }
  return bestName;
}

export default function TopCycles({
  agg, zip3, filter, onSelectState, onSelectZip3, onSelectEpc,
  hoverZip, onHoverZip, railMode = 'speed', onRailMode,
}: Props) {
  const drilled = !!filter.stateAbbr;
  const zip3Drilled = !!filter.zip3;

  // ZIP3 drill → rail becomes the ZIP5 ranking + copy-all panel.
  if (drilled && zip3Drilled) {
    return (
      <Zip5Panel
        zip3={filter.zip3!}
        stateAbbr={filter.stateAbbr!}
        agg={agg}
        filter={filter}
        hoverZip={hoverZip ?? null}
        onHoverZip={onHoverZip ?? (() => {})}
        onBack={() => onSelectZip3?.(null)}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {drilled && (
        <RailModeToggle mode={railMode} onChange={onRailMode ?? (() => {})} />
      )}
      {drilled && railMode === 'workable' ? (
        <WorkableList
          agg={agg}
          zip3={zip3}
          filter={filter}
          hoverZip={hoverZip ?? null}
          onHoverZip={onHoverZip ?? (() => {})}
          onSelectZip3Row={onSelectZip3 ?? (() => {})}
        />
      ) : (
        <PrimaryList
          agg={agg}
          zip3={zip3}
          filter={filter}
          onSelectState={onSelectState}
          onSelectZip3={onSelectZip3}
          hoverZip={hoverZip ?? null}
          onHoverZip={onHoverZip ?? (() => {})}
        />
      )}
      {filter.channel === 'E' && !drilled && (
        <EpcList agg={agg} filter={filter} onSelectEpc={onSelectEpc ?? (() => {})} onSelectState={onSelectState} />
      )}
      {filter.channel === 'E' && drilled && railMode === 'speed' && (
        <EpcList agg={agg} filter={filter} onSelectEpc={onSelectEpc ?? (() => {})} onSelectState={onSelectState} />
      )}
    </div>
  );
}

function RailModeToggle({ mode, onChange }: { mode: RailMode; onChange: (m: RailMode) => void }) {
  const base: React.CSSProperties = {
    padding: '7px 12px',
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    border: 0,
    background: 'transparent',
    color: SUBTLE,
  };
  return (
    <div style={{ display: 'inline-flex', background: SURFACE, border: `1px solid ${LINE_HI}`, borderRadius: 999, overflow: 'hidden', width: 'fit-content' }}>
      <button onClick={() => onChange('speed')} style={{ ...base, background: mode === 'speed' ? SUN : 'transparent', color: mode === 'speed' ? '#0D1023' : SUBTLE }}>
        Fastest
      </button>
      <button onClick={() => onChange('workable')} style={{ ...base, background: mode === 'workable' ? SUN : 'transparent', color: mode === 'workable' ? '#0D1023' : SUBTLE }}>
        Workable area
      </button>
    </div>
  );
}

interface PrimaryProps {
  agg: Agg;
  zip3: Zip3Meta[];
  filter: FilterState;
  onSelectState: (abbr: string) => void;
  onSelectZip3?: (p: string) => void;
  hoverZip: string | null;
  onHoverZip: (p: string | null) => void;
}

function PrimaryList({ agg, zip3, filter, onSelectState, onSelectZip3, hoverZip, onHoverZip }: PrimaryProps) {
  const [expanded, setExpanded] = useState(false);
  const metricIsCount = filter.metric === 'n';

  const isEpc = filter.channel === 'E';
  const serviceable = useServiceableStates();
  const enerflo = useEnerfloCoverage();

  // Mirror MapCanvas: EPC uses the 6-month install footprint instead of
  // the Finance guide, so Fastest states excludes states we don't actively
  // sell EPC into. Direct uses the Enerflo installer-markets set.
  const epcActive = useMemo(() => {
    if (!isEpc) return null;
    const out = new Set<string>();
    const prefix = `ES|6|E|${filter.inc}|`;
    for (const key of Object.keys(agg)) {
      if (!key.startsWith(prefix)) continue;
      if (installCount(agg[key]) <= 0) continue;
      const parts = key.split('|');
      if (parts[4]) out.add(parts[4]);
    }
    return out;
  }, [agg, filter.inc, isEpc]);

  const activeServiceSet = isEpc
    ? epcActive
    : (enerflo && enerflo.states.size > 0 ? enerflo.states : serviceable);

  const rows = useMemo<Row[]>(() => {
    if (filter.stateAbbr) {
      const inState = zip3.filter(z => z.st === filter.stateAbbr);
      return inState
        .map(z => {
          const row = getAgg(agg, 'Z3', filter, z.p);
          return {
            key: z.p,
            primary: z.p,
            secondary: z.city,
            epc: isEpc ? bestEpcIn(agg, filter, 'EZ', z.p) ?? undefined : undefined,
            value: pickMetric(row, filter.metric) ?? Infinity,
            count: installCount(row),
          };
        })
        .filter(r => r.count >= MIN.Z3)
        .sort((a, b) => (metricIsCount ? b.value - a.value : a.value - b.value));
    }
    const abbrs = Object.keys(STATE_NAMES);
    return abbrs
      .map(abbr => {
        const row = getAgg(agg, 'S', filter, abbr);
        return {
          key: abbr,
          primary: abbr,
          secondary: STATE_NAMES[abbr],
          epc: isEpc ? bestEpcIn(agg, filter, 'ES', abbr) ?? undefined : undefined,
          value: pickMetric(row, filter.metric) ?? Infinity,
          count: installCount(row),
        };
      })
      .filter(r => r.count >= MIN.S)
      // Match the map's greyed-out treatment: skip states outside the
      // channel's active service set (financiers for Direct, 6mo EPC
      // installs for EPC).
      .filter(r => !activeServiceSet || activeServiceSet.size === 0 || activeServiceSet.has(r.primary))
      .sort((a, b) => (metricIsCount ? b.value - a.value : a.value - b.value));
  }, [agg, zip3, filter, metricIsCount, isEpc, activeServiceSet]);

  const visible = expanded ? rows : rows.slice(0, 5);
  const title = metricIsCount
    ? (filter.stateAbbr ? `Top ZIP3s by volume \u00b7 ${filter.stateAbbr}` : 'Top states by volume')
    : (filter.stateAbbr ? `Fastest ZIP3s \u00b7 ${filter.stateAbbr}` : 'Fastest states');
  const subhead = `${filter.channel === 'D' ? 'Direct' : 'EPC'} \u00b7 ${filter.window === '12' ? '1 yr' : filter.window + ' mo'}`;

  return (
    <div style={{ fontFamily: SANS, color: TEXT }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: MUTED, textTransform: 'uppercase', marginBottom: 6 }}>
        {subhead}
      </div>
      <h3 style={{ margin: '0 0 10px', fontFamily: DISPLAY, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {title}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visible.map((r, i) => {
          const isHot = !!filter.stateAbbr && hoverZip === r.key;
          return (
            <button
              key={r.key}
              onClick={() => {
                if (filter.stateAbbr && onSelectZip3) onSelectZip3(r.primary);
                else onSelectState(r.primary);
              }}
              onMouseEnter={() => { if (filter.stateAbbr) onHoverZip(r.key); }}
              onMouseLeave={() => { if (filter.stateAbbr) onHoverZip(null); }}
              style={{
                ...primaryRowStyle,
                background: isHot ? '#242A58' : primaryRowStyle.background,
                borderColor: isHot ? SUN : LINE_HI,
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.08em' }}>{i + 1}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: 13, letterSpacing: '0.08em', color: SUN }}>{r.primary}</span>
              <span style={{ minWidth: 0, overflow: 'hidden' }}>
                <span style={{ display: 'block', fontSize: 12, color: SUBTLE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.secondary}
                </span>
                {r.epc && (
                  <span style={{ display: 'block', fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.epc}
                  </span>
                )}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: TEXT, fontWeight: 700 }}>
                {metricIsCount ? r.value.toLocaleString() : `${Math.round(r.value)}d`}
              </span>
            </button>
          );
        })}
        {visible.length === 0 && (
          <div style={{ padding: '18px 12px', fontSize: 12, color: MUTED, fontStyle: 'italic' }}>
            Nothing meets the minimum install threshold under this filter.
          </div>
        )}
      </div>

      {rows.length > 5 && (
        <button onClick={() => setExpanded(v => !v)} style={expandBtn}>
          {expanded ? 'Show top 5' : `See all ${rows.length}`}
        </button>
      )}
    </div>
  );
}

interface EpcRow {
  epc: string;
  states: string[];
  value: number;    // metric (lower is better for time, higher for volume)
  count: number;    // install count
}

function EpcList({
  agg,
  filter,
  onSelectEpc,
  onSelectState,
}: {
  agg: Agg;
  filter: FilterState;
  onSelectEpc: (epc: string | null, states: string[]) => void;
  onSelectState: (abbr: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const metricIsCount = filter.metric === 'n';
  const scopeAbbr = filter.stateAbbr;

  // Aggregate across ES keys: "ES|window|E|inc|<state>|<epc>" => AggValue.
  // Index 0 is install count. For time metrics we recompute a count-weighted
  // mean across states so the ranking matches what the user sees on the map.
  const rows = useMemo<EpcRow[]>(() => {
    const inc = filter.inc;
    const prefix = `ES|${filter.window}|E|${inc}|`;
    const byEpc = new Map<string, { statesHit: Set<string>; total: number; weighted: number }>();
    const metricIdx = METRIC_INDEX[filter.metric];

    for (const key of Object.keys(agg)) {
      if (!key.startsWith(prefix)) continue;
      const parts = key.split('|');
      const stateAbbr = parts[4];
      const epc = parts[5];
      if (!epc) continue;
      if (scopeAbbr && stateAbbr !== scopeAbbr) continue;
      const row: AggValue = agg[key];
      const n = installCount(row);
      if (n <= 0) continue;
      const bucket = byEpc.get(epc) ?? { statesHit: new Set<string>(), total: 0, weighted: 0 };
      bucket.statesHit.add(stateAbbr);
      bucket.total += n;
      const v = row[metricIdx];
      if (typeof v === 'number') bucket.weighted += v * n;
      byEpc.set(epc, bucket);
    }

    const out: EpcRow[] = [];
    for (const [epc, b] of byEpc) {
      if (b.total < MIN.S) continue;
      const value = metricIsCount ? b.total : (b.weighted > 0 ? b.weighted / b.total : Infinity);
      out.push({ epc, states: Array.from(b.statesHit).sort(), value, count: b.total });
    }
    out.sort((a, b) => (metricIsCount ? b.value - a.value : a.value - b.value));
    return out;
  }, [agg, filter.window, filter.inc, filter.metric, scopeAbbr, metricIsCount]);

  const visible = expanded ? rows : rows.slice(0, 5);
  const title = scopeAbbr
    ? (metricIsCount ? `Top EPCs by volume \u00b7 ${scopeAbbr}` : `Fastest EPCs \u00b7 ${scopeAbbr}`)
    : (metricIsCount ? 'Top EPCs by volume' : 'Fastest EPCs');

  function activate(r: EpcRow) {
    if (r.states.length === 1) {
      onSelectState(r.states[0]);
      onSelectEpc(null, []);
      return;
    }
    const next = filter.activeEpc === r.epc ? null : r.epc;
    onSelectEpc(next, next ? r.states : []);
  }

  return (
    <div style={{ fontFamily: SANS, color: TEXT }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: MUTED, textTransform: 'uppercase', marginBottom: 6 }}>
        EPC partners
      </div>
      <h3 style={{ margin: '0 0 10px', fontFamily: DISPLAY, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {title}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visible.map((r, i) => {
          const isActive = filter.activeEpc === r.epc;
          return (
            <button
              key={r.epc}
              onClick={() => activate(r)}
              style={{
                ...rowStyle,
                background: isActive ? '#242A58' : SURFACE,
                borderColor: isActive ? SUN : LINE_HI,
              }}
              title={r.states.length === 1 ? `Drill to ${r.states[0]}` : `Operates in ${r.states.length} states`}
            >
              <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.08em' }}>{i + 1}</span>
              <span style={ellipsisStyle}>
                <span style={{ fontFamily: DISPLAY, fontSize: 13, letterSpacing: '0.04em', color: SUN, textTransform: 'uppercase' }}>
                  {r.epc}
                </span>
                <span style={{ display: 'block', fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.14em', marginTop: 2 }}>
                  {r.states.length === 1 ? r.states[0] : `${r.states.length} states`}
                </span>
              </span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: TEXT, fontWeight: 700 }}>
                {metricIsCount ? r.value.toLocaleString() : `${Math.round(r.value)}d`}
              </span>
            </button>
          );
        })}
        {visible.length === 0 && (
          <div style={{ padding: '18px 12px', fontSize: 12, color: MUTED, fontStyle: 'italic' }}>
            No EPC partners under this filter.
          </div>
        )}
      </div>

      {rows.length > 5 && (
        <button onClick={() => setExpanded(v => !v)} style={expandBtn}>
          {expanded ? 'Show top 5' : `See all ${rows.length}`}
        </button>
      )}
    </div>
  );
}

const primaryRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '26px 48px 1fr auto',
  gap: 10,
  alignItems: 'center',
  padding: '9px 12px',
  background: SURFACE,
  border: `1px solid ${LINE_HI}`,
  borderRadius: 8,
  cursor: 'pointer',
  color: TEXT,
  fontFamily: SANS,
  textAlign: 'left',
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '26px 1fr auto',
  gap: 10,
  alignItems: 'center',
  padding: '9px 12px',
  background: SURFACE,
  border: `1px solid ${LINE_HI}`,
  borderRadius: 8,
  cursor: 'pointer',
  color: TEXT,
  fontFamily: SANS,
  textAlign: 'left',
};

const ellipsisStyle: React.CSSProperties = {
  fontSize: 12,
  color: SUBTLE,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
};

const expandBtn: React.CSSProperties = {
  marginTop: 10,
  width: '100%',
  background: 'transparent',
  color: SUN,
  border: `1px solid ${LINE_HI}`,
  borderRadius: 999,
  padding: '8px 14px',
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

// --- Workable area list (Enerflo-covered ZIP3s by install volume) --------

interface WorkableListProps {
  agg: Agg;
  zip3: Zip3Meta[];
  filter: FilterState;
  hoverZip: string | null;
  onHoverZip: (p: string | null) => void;
  onSelectZip3Row: (p: string | null) => void;
}

function WorkableList({ agg, zip3, filter, hoverZip, onHoverZip, onSelectZip3Row }: WorkableListProps) {
  const [expanded, setExpanded] = useState(false);
  const enerflo = useEnerfloCoverage();

  const rows = useMemo(() => {
    if (!filter.stateAbbr) return [];
    // Which ZIP3s do we actually sell into in this state (per Enerflo)?
    const workable = new Set<string>();
    if (enerflo) {
      for (const [z5, meta] of enerflo.zipLookup) {
        if (meta.state === filter.stateAbbr) workable.add(z5.slice(0, 3));
      }
    }
    const inState = zip3.filter(z => z.st === filter.stateAbbr && workable.has(z.p));
    return inState
      .map(z => {
        const row = getAgg(agg, 'Z3', filter, z.p);
        return { key: z.p, primary: z.p, secondary: z.city, count: installCount(row) };
      })
      .sort((a, b) => b.count - a.count);
  }, [agg, zip3, filter, enerflo]);

  const visible = expanded ? rows : rows.slice(0, 10);

  return (
    <div style={{ fontFamily: SANS, color: TEXT }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: MUTED, textTransform: 'uppercase', marginBottom: 6 }}>
        Enerflo coverage
      </div>
      <h3 style={{ margin: '0 0 10px', fontFamily: DISPLAY, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {`Workable area \u00b7 ${filter.stateAbbr}`}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visible.map(r => {
          const isHot = hoverZip === r.key;
          return (
            <button
              key={r.key}
              onMouseEnter={() => onHoverZip(r.key)}
              onMouseLeave={() => onHoverZip(null)}
              onClick={() => onSelectZip3Row(r.key)}
              style={{
                ...primaryRowStyle,
                gridTemplateColumns: '48px 1fr auto',
                background: isHot ? '#242A58' : SURFACE,
                borderColor: isHot ? SUN : LINE_HI,
              }}
              title={`Open ZIPs we service in ${r.primary}xx`}
            >
              <span style={{ fontFamily: DISPLAY, fontSize: 13, letterSpacing: '0.08em', color: SUN }}>{r.primary}</span>
              <span style={ellipsisStyle}>{r.secondary}</span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: TEXT, fontWeight: 700 }}>
                {r.count.toLocaleString()} inst
              </span>
            </button>
          );
        })}
        {visible.length === 0 && (
          <div style={{ padding: '18px 12px', fontSize: 12, color: MUTED, fontStyle: 'italic' }}>
            No Enerflo-covered ZIPs in {filter.stateAbbr} under this filter.
          </div>
        )}
      </div>

      {rows.length > 10 && (
        <button onClick={() => setExpanded(v => !v)} style={expandBtn}>
          {expanded ? 'Show top 10' : `See all ${rows.length}`}
        </button>
      )}
    </div>
  );
}

// --- ZIP5 copy panel ----------------------------------------------------

interface Zip5PanelProps {
  zip3: string;
  stateAbbr: string;
  agg: Agg;
  filter: FilterState;
  hoverZip: string | null;
  onHoverZip: (p: string | null) => void;
  onBack: () => void;
}

function Zip5Panel({ zip3, stateAbbr, agg, filter, hoverZip, onHoverZip, onBack }: Zip5PanelProps) {
  const enerflo = useEnerfloCoverage();
  const [copied, setCopied] = useState(false);

  const zips = useMemo(() => {
    if (!enerflo) return [] as { z5: string; metro: string; zone: number }[];
    const out: { z5: string; metro: string; zone: number }[] = [];
    for (const [z5, meta] of enerflo.zipLookup) {
      if (meta.state === stateAbbr && z5.startsWith(zip3)) {
        out.push({ z5, metro: meta.metro, zone: meta.zone });
      }
    }
    return out.sort((a, b) => a.z5.localeCompare(b.z5));
  }, [enerflo, zip3, stateAbbr]);

  // Group by metro+zone for context
  const groups = useMemo(() => {
    const m = new Map<string, { metro: string; zone: number; zips: string[] }>();
    for (const r of zips) {
      const k = `${r.metro}\u00a0\u00b7\u00a0Z${r.zone}`;
      const g = m.get(k) ?? { metro: r.metro, zone: r.zone, zips: [] };
      g.zips.push(r.z5);
      m.set(k, g);
    }
    return [...m.values()];
  }, [zips]);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(zips.map(z => z.z5).join(', '));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback via temporary textarea
      const ta = document.createElement('textarea');
      ta.value = zips.map(z => z.z5).join(', ');
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div style={{ fontFamily: SANS, color: TEXT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: `1px solid ${LINE_HI}`,
            borderRadius: 999,
            color: SUBTLE,
            padding: '5px 10px',
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {'\u2190 Back'}
        </button>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: MUTED, textTransform: 'uppercase' }}>
          Workable zips
        </span>
      </div>
      <h3 style={{ margin: '0 0 10px', fontFamily: DISPLAY, fontSize: 18, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
        {zip3}xx {'\u00b7 '}
        <span style={{ color: SUN }}>{zips.length}</span>
        <span style={{ color: MUTED, fontSize: 13 }}>{' '}zips</span>
      </h3>

      <button
        onClick={copyAll}
        disabled={zips.length === 0}
        style={{
          width: '100%',
          background: copied ? '#5EE493' : SUN,
          color: '#0D1023',
          border: 0,
          borderRadius: 999,
          padding: '10px 14px',
          fontFamily: DISPLAY,
          fontSize: 12,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          cursor: zips.length === 0 ? 'not-allowed' : 'pointer',
          opacity: zips.length === 0 ? 0.5 : 1,
          marginBottom: 12,
        }}
      >
        {copied ? 'Copied' : `Copy all ${zips.length} zips`}
      </button>

      {groups.length === 0 && (
        <div style={{ padding: '18px 12px', fontSize: 12, color: MUTED, fontStyle: 'italic', border: `1px solid ${LINE_HI}`, borderRadius: 8 }}>
          No Enerflo-covered ZIPs in {zip3}xx. We don&rsquo;t sell here right now.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map(g => (
          <div key={`${g.metro}-${g.zone}`} style={{ background: SURFACE, border: `1px solid ${LINE_HI}`, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{g.metro}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: SUN, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Zone {g.zone}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {g.zips.map(z => {
                const row = getAgg(agg, 'Z5', filter, z);
                const n = installCount(row);
                const med = pickMetric(row, 'med');
                const isHot = hoverZip === z;
                const tooltip = n > 0
                  ? `${z} \u00b7 ${n} install${n === 1 ? '' : 's'}${med != null ? ` \u00b7 ${Math.round(med)}d median` : ''}`
                  : `${z} \u00b7 no installs under this filter`;
                return (
                  <span
                    key={z}
                    title={tooltip}
                    onMouseEnter={() => onHoverZip(z)}
                    onMouseLeave={() => onHoverZip(null)}
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      color: TEXT,
                      background: isHot ? '#242A58' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isHot ? SUN : LINE_HI}`,
                      borderRadius: 6,
                      padding: '3px 7px',
                      cursor: 'default',
                    }}
                  >
                    {z}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
