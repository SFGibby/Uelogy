'use client';

import { useMemo, useState } from 'react';
import type { Agg, AggValue, FilterState, Zip3Meta, MetricKey } from './types';
import { getAgg, installCount, pickMetric } from './heat';
import { MIN, METRIC_INDEX } from './types';

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

interface Props {
  agg: Agg;
  zip3: Zip3Meta[];
  filter: FilterState;
  onSelectState: (abbr: string) => void;
  onSelectZip3?: (p: string) => void;
  onSelectEpc?: (epc: string | null, states: string[]) => void;
  hoverZip?: string | null;
  onHoverZip?: (p: string | null) => void;
}

interface Row {
  key: string;
  primary: string;
  secondary: string;
  value: number;
  count: number;
}

export default function TopCycles({ agg, zip3, filter, onSelectState, onSelectZip3, onSelectEpc, hoverZip, onHoverZip }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PrimaryList
        agg={agg}
        zip3={zip3}
        filter={filter}
        onSelectState={onSelectState}
        onSelectZip3={onSelectZip3}
        hoverZip={hoverZip ?? null}
        onHoverZip={onHoverZip ?? (() => {})}
      />
      {filter.channel === 'E' && (
        <EpcList agg={agg} filter={filter} onSelectEpc={onSelectEpc ?? (() => {})} onSelectState={onSelectState} />
      )}
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
          value: pickMetric(row, filter.metric) ?? Infinity,
          count: installCount(row),
        };
      })
      .filter(r => r.count >= MIN.S)
      .sort((a, b) => (metricIsCount ? b.value - a.value : a.value - b.value));
  }, [agg, zip3, filter, metricIsCount]);

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
              <span style={ellipsisStyle}>{r.secondary}</span>
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
