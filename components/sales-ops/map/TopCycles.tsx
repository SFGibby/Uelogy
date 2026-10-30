'use client';

import { useMemo, useState } from 'react';
import type { Agg, FilterState, Zip3Meta } from './types';
import { getAgg, installCount, pickMetric } from './heat';
import { MIN } from './types';

const SANS = 'var(--font-swagger-sans), -apple-system, system-ui, sans-serif';
const DISPLAY = 'var(--font-swagger-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-swagger-mono), ui-monospace, monospace';

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
}

interface Row {
  key: string;
  primary: string;    // state abbr or ZIP3
  secondary: string;  // name / city
  value: number;      // metric value (lower is better for time; higher for volume)
  count: number;      // install count
}

export default function TopCycles({ agg, zip3, filter, onSelectState, onSelectZip3 }: Props) {
  const [expanded, setExpanded] = useState(false);
  const metricIsCount = filter.metric === 'n';

  const rows = useMemo<Row[]>(() => {
    if (filter.stateAbbr) {
      // ZIP3s inside the selected state
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
  const subhead = `${filter.channel === 'D' ? 'Direct' : 'EPC'} \u00b7 ${filter.window === 'A' ? 'All time' : filter.window === '12' ? '1 yr' : filter.window + ' mo'}`;

  return (
    <div style={{ fontFamily: SANS, color: TEXT }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: MUTED, textTransform: 'uppercase', marginBottom: 6 }}>
        {subhead}
      </div>
      <h3 style={{ margin: '0 0 10px', fontFamily: DISPLAY, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {title}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visible.map((r, i) => (
          <button
            key={r.key}
            onClick={() => {
              if (filter.stateAbbr && onSelectZip3) onSelectZip3(r.primary);
              else onSelectState(r.primary);
            }}
            style={{
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
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.08em' }}>{i + 1}</span>
            <span style={{ fontFamily: DISPLAY, fontSize: 13, letterSpacing: '0.08em', color: SUN }}>{r.primary}</span>
            <span style={{ fontSize: 12, color: SUBTLE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.secondary}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 12, color: TEXT, fontWeight: 700 }}>
              {metricIsCount ? r.value.toLocaleString() : `${Math.round(r.value)}d`}
            </span>
          </button>
        ))}
        {visible.length === 0 && (
          <div style={{ padding: '18px 12px', fontSize: 12, color: MUTED, fontStyle: 'italic' }}>
            Nothing meets the minimum install threshold under this filter.
          </div>
        )}
      </div>

      {rows.length > 5 && (
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
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
          }}
        >
          {expanded ? 'Show top 5' : `See all ${rows.length}`}
        </button>
      )}
    </div>
  );
}
