'use client';

import { useMemo } from 'react';
import type { Agg, FilterState, Zip3Meta } from './types';
import { getAgg, installCount, pickMetric } from './heat';
import { MIN } from './types';

const SANS = 'var(--font-swagger-sans), -apple-system, system-ui, sans-serif';
const MONO = 'var(--font-swagger-mono), ui-monospace, monospace';
const DISPLAY = 'var(--font-swagger-display), "Archivo Black", Impact, sans-serif';

const SURFACE = '#171B38';
const LINE = 'rgba(255,255,255,0.08)';
const LINE_HI = 'rgba(255,255,255,0.14)';
const TEXT = '#FFFFFF';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

// States we care about (lower 48 + AK + HI). Pulled from US topology at build
// time elsewhere; hardcoded here for Phase 1 simplicity.
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
}

export default function CycleTable({ agg, filter, onSelectState }: Props) {
  const rows = useMemo(() => {
    const q = filter.query.trim().toLowerCase();
    const abbrs = Object.keys(STATE_NAMES);
    const out = abbrs.map(abbr => {
      const dRow = getAgg(agg, 'S', { ...filter, channel: 'D', inc: 0 }, abbr);
      const eRow = getAgg(agg, 'S', { ...filter, channel: 'E' }, abbr);
      return {
        abbr,
        name: STATE_NAMES[abbr],
        dCount: installCount(dRow),
        dMed: pickMetric(dRow, 'med'),
        eCount: installCount(eRow),
        eMed: pickMetric(eRow, 'med'),
      };
    });
    const filtered = q
      ? out.filter(r =>
          r.abbr.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
      : out;
    const activeCh = filter.channel === 'D' ? 'dMed' : 'eMed';
    return filtered
      .filter(r => r.dCount + r.eCount > 0)
      .sort((a, b) => {
        const av = a[activeCh as keyof typeof a];
        const bv = b[activeCh as keyof typeof b];
        if (av == null) return 1;
        if (bv == null) return -1;
        return (av as number) - (bv as number);
      });
  }, [agg, filter]);

  return (
    <div style={{ fontFamily: SANS, color: TEXT }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Cycle times
        </h3>
        <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Direct vs EPC &middot; {rows.length} states
        </span>
      </div>
      <div style={{ background: SURFACE, border: `1px solid ${LINE_HI}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 70px 60px 70px 60px', padding: '10px 14px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: MUTED, textTransform: 'uppercase', borderBottom: `1px solid ${LINE}` }}>
          <span>State</span>
          <span></span>
          <span style={{ textAlign: 'right' }}>D</span>
          <span style={{ textAlign: 'right' }}>D med</span>
          <span style={{ textAlign: 'right' }}>E</span>
          <span style={{ textAlign: 'right' }}>E med</span>
        </div>
        <div style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
          {rows.map(r => {
            const highlight = filter.stateAbbr === r.abbr;
            return (
              <button
                key={r.abbr}
                onClick={() => onSelectState(r.abbr)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 70px 60px 70px 60px',
                  width: '100%',
                  padding: '10px 14px',
                  background: highlight ? 'rgba(250,214,70,0.08)' : 'transparent',
                  color: TEXT,
                  border: 0,
                  borderBottom: `1px solid ${LINE}`,
                  cursor: 'pointer',
                  fontFamily: SANS,
                  fontSize: 13,
                  textAlign: 'left',
                }}
              >
                <span style={{ fontFamily: MONO, color: highlight ? SUN : SUBTLE, letterSpacing: '0.1em', fontWeight: 700 }}>{r.abbr}</span>
                <span style={{ color: TEXT }}>{r.name}</span>
                <span style={{ textAlign: 'right', fontFamily: MONO, color: r.dCount >= MIN.S ? TEXT : MUTED }}>
                  {r.dCount.toLocaleString()}
                </span>
                <span style={{ textAlign: 'right', fontFamily: MONO, color: r.dMed != null ? TEXT : MUTED }}>
                  {r.dMed != null ? `${Math.round(r.dMed)}` : '\u2013'}
                </span>
                <span style={{ textAlign: 'right', fontFamily: MONO, color: r.eCount >= MIN.S ? TEXT : MUTED }}>
                  {r.eCount.toLocaleString()}
                </span>
                <span style={{ textAlign: 'right', fontFamily: MONO, color: r.eMed != null ? TEXT : MUTED }}>
                  {r.eMed != null ? `${Math.round(r.eMed)}` : '\u2013'}
                </span>
              </button>
            );
          })}
          {rows.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: MUTED, fontSize: 13 }}>
              No matches.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
