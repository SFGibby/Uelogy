'use client';

import { useCallback, useMemo, useState } from 'react';
import type { FilterState } from './types';
import { useMapData } from './useMapData';
import { getAgg, installCount, pickMetric } from './heat';
import Controls from './Controls';
import Breadcrumb from './Breadcrumb';
import MapCanvas from './MapCanvas';
import TopCycles from './TopCycles';
import CycleTable from './CycleTable';

const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';
const DISPLAY = 'var(--font-gibson-display), "Archivo Black", Impact, sans-serif';

const INK = '#0D1023';
const SURFACE = '#171B38';
const LINE_HI = 'rgba(255,255,255,0.14)';
const TEXT = '#FFFFFF';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

const INITIAL: FilterState = {
  channel: 'D',
  window: '12',
  metric: 'med',
  inc: 0,
  dq: true,
  level: 'US',
  stateAbbr: null,
  zip3: null,
  activeEpc: null,
  query: '',
};

export default function OpsMap() {
  const { data, loading, error } = useMapData();
  const [filter, setFilter] = useState<FilterState>(INITIAL);
  const [tableOpen, setTableOpen] = useState(false);
  const [hoverZip, setHoverZip] = useState<string | null>(null);

  const onChange = useCallback((patch: Partial<FilterState>) => {
    setFilter(f => ({ ...f, ...patch }));
  }, []);

  const onSelectState = useCallback((abbr: string | null) => {
    setFilter(f => ({
      ...f,
      stateAbbr: abbr,
      zip3: null,
      activeEpc: null,
      level: abbr ? 'STATE' : 'US',
    }));
  }, []);

  const onSelectEpc = useCallback((epc: string | null) => {
    setFilter(f => ({ ...f, activeEpc: epc }));
  }, []);

  const totals = useMemo(() => {
    if (!data) return { installs: 0, median: null as number | null };
    const row = getAgg(data.AGG, 'S', filter, 'ALL');
    return {
      installs: installCount(row),
      median: pickMetric(row, 'med'),
    };
  }, [data, filter]);

  if (error) {
    return (
      <div style={{ padding: 48, color: '#FF8B9F', fontFamily: SANS }}>
        Map data failed to load: {error}
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div style={{ padding: 48, color: MUTED, fontFamily: MONO, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
        Loading map\u2026
      </div>
    );
  }

  return (
    <div style={{ background: INK, color: TEXT, fontFamily: SANS, minHeight: 'calc(100vh - 55px)' }}>
      <section style={{ padding: '32px 20px 10px' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.3em', color: SUN, textTransform: 'uppercase', marginBottom: 10 }}>
          Install speed
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: DISPLAY,
            fontSize: 'clamp(36px, 6vw, 72px)',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
          }}
        >
          Where the floor<br />
          <span style={{ color: SUN }}>moves fastest.</span>
        </h1>
        <p style={{ marginTop: 12, maxWidth: 580, color: SUBTLE, fontSize: 14, lineHeight: 1.6 }}>
          Install density by ZIP3 under the current filter. Click a state to focus, Esc to go back.
        </p>
      </section>

      <Controls filter={filter} onChange={onChange} totalInstalls={totals.installs} totalMedian={totals.median} />
      <Breadcrumb filter={filter} onChange={onChange} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, padding: '0 20px 24px' }}>
        <div style={{ minWidth: 0 }}>
          <MapCanvas
            zip3={data.ZIP3}
            agg={data.AGG}
            filter={filter}
            onSelectState={onSelectState}
            hoverZip={hoverZip}
            onHoverZip={setHoverZip}
          />
          <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => setTableOpen(v => !v)}
              style={{
                background: SURFACE,
                border: `1px solid ${LINE_HI}`,
                borderRadius: 999,
                color: TEXT,
                padding: '9px 18px',
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {tableOpen ? 'Hide table' : 'Show table'}
            </button>
            <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Snapshot {data.META.as_of}
            </span>
          </div>
          {tableOpen && (
            <div style={{ marginTop: 14 }}>
              <CycleTable agg={data.AGG} zip3={data.ZIP3} filter={filter} onSelectState={abbr => onSelectState(abbr)} />
            </div>
          )}
        </div>

        <aside>
          <TopCycles
            agg={data.AGG}
            zip3={data.ZIP3}
            filter={filter}
            onSelectState={abbr => onSelectState(abbr)}
            onSelectEpc={(epc) => onSelectEpc(epc)}
            hoverZip={hoverZip}
            onHoverZip={setHoverZip}
          />
        </aside>
      </div>
    </div>
  );
}
