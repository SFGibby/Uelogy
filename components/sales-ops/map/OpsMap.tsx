'use client';

import { useCallback, useMemo, useState } from 'react';
import type { FilterState } from './types';
import { DEFAULT_LAYERS } from './types';
import { useMapData, useFinanciers, useUtilityRates } from './useMapData';
import { getAgg, installCount, pickMetric } from './heat';
import Controls from './Controls';
import Breadcrumb from './Breadcrumb';
import MapCanvas from './MapCanvas';
import TopCycles from './TopCycles';
import CycleTable from './CycleTable';
import MobileMarkets from './MobileMarkets';
import LegendNote from './LegendNote';
import StateSummary from './StateSummary';
import { useIsNarrow } from '../useBreakpoint';

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
  stateShading: 'metric',
  financierFilter: null,
  layers: DEFAULT_LAYERS,
};

export default function OpsMap() {
  const { data, loading, error } = useMapData();
  const financiersFile = useFinanciers();
  const utility = useUtilityRates();
  const financiers = financiersFile?.financiers ?? null;
  const [filter, setFilter] = useState<FilterState>(INITIAL);
  const [tableOpen, setTableOpen] = useState(false);
  const [hoverZip, setHoverZip] = useState<string | null>(null);
  const [hoverState, setHoverState] = useState<string | null>(null);
  const isNarrow = useIsNarrow();

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

  const onSelectZip3 = useCallback((zip3: string | null) => {
    setFilter(f => ({
      ...f,
      zip3,
      level: zip3 ? 'ZIP3' : (f.stateAbbr ? 'STATE' : 'US'),
    }));
  }, []);

  const onSelectEpc = useCallback((epc: string | null) => {
    setFilter(f => ({ ...f, activeEpc: epc }));
  }, []);

  const totals = useMemo(() => {
    if (!data) return { installs: 0, median: null as number | null };
    // National totals live in the 'T' section (key: T|window|channel|inc|ALL|).
    const inc = filter.channel === 'E' ? filter.inc : 0;
    const key = `T|${filter.window}|${filter.channel}|${inc}|ALL|`;
    const row = data.AGG[key] ?? null;
    return {
      installs: installCount(row),
      median: pickMetric(row, 'med'),
    };
  }, [data, filter]);

  const breadcrumbMeta = useMemo(() => {
    if (!data || !filter.stateAbbr) return null;
    const inc = filter.channel === 'E' ? filter.inc : 0;
    if (filter.zip3) {
      const row = data.AGG[`Z3|${filter.window}|${filter.channel}|${inc}|${filter.zip3}|`] ?? null;
      const n = installCount(row);
      const m = pickMetric(row, 'med');
      if (!n) return null;
      return `${n.toLocaleString()} installs${m != null ? ` · median ${Math.round(m)} d` : ''}`;
    }
    const row = data.AGG[`S|${filter.window}|${filter.channel}|${inc}|${filter.stateAbbr}|`] ?? null;
    const n = installCount(row);
    const m = pickMetric(row, 'med');
    if (!n) return null;
    return `${n.toLocaleString()} installs${m != null ? ` · median ${Math.round(m)} d` : ''}`;
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

  // On narrow viewports the map is unusable — swap to a searchable market
  // table that answers the same "where should I knock?" question without
  // hover, pinch-to-zoom, or a 975-pixel SVG.
  if (isNarrow) {
    return (
      <div style={{ background: INK, color: TEXT, fontFamily: SANS, minHeight: 'calc(100vh - 55px)' }}>
        <Breadcrumb filter={filter} onChange={onChange} />
        <Controls filter={filter} onChange={onChange} totalInstalls={totals.installs} totalMedian={totals.median} zip3={data.ZIP3} onSelectState={onSelectState} onSelectZip3={onSelectZip3} financiers={financiers} />
        <MobileMarkets
          agg={data.AGG}
          zip3={data.ZIP3}
          filter={filter}
          onSelectState={onSelectState}
          onSelectZip3={onSelectZip3}
        />
      </div>
    );
  }

  return (
    <div style={{ background: INK, color: TEXT, fontFamily: SANS, minHeight: 'calc(100vh - 55px)' }}>
      <section style={{ padding: '22px 20px 8px' }}>
        <h1
          style={{
            margin: 0,
            fontFamily: DISPLAY,
            fontSize: 'clamp(28px, 3vw, 40px)',
            lineHeight: 1,
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
          }}
        >
          The <span style={{ color: SUN }}>Big Map</span>
        </h1>
      </section>

      <Controls filter={filter} onChange={onChange} totalInstalls={totals.installs} totalMedian={totals.median} zip3={data.ZIP3} onSelectState={onSelectState} onSelectZip3={onSelectZip3} financiers={financiers} />
      {filter.stateAbbr && <Breadcrumb filter={filter} onChange={onChange} meta={breadcrumbMeta} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, padding: '0 20px 24px' }}>
        <div style={{ minWidth: 0 }}>
          <MapCanvas
            zip3={data.ZIP3}
            agg={data.AGG}
            dq={data.DQ}
            filter={filter}
            onSelectState={onSelectState}
            onHoverState={setHoverState}
            hoverZip={hoverZip}
            onHoverZip={setHoverZip}
            onSelectZip3={onSelectZip3}
          />
          <LegendNote filter={filter} utility={utility} financiers={financiers} />
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
          <StateSummary
            filter={filter}
            hoverState={hoverState}
            utility={utility}
            financiers={financiers}
            agg={data.AGG}
            esIndex={data.esIndex}
            zip3={data.ZIP3}
            onSelectZip3={onSelectZip3}
          />
          <TopCycles
            agg={data.AGG}
            esIndex={data.esIndex}
            ezIndex={data.ezIndex}
            zip3={data.ZIP3}
            filter={filter}
            onSelectState={abbr => onSelectState(abbr)}
            onSelectEpc={(epc) => onSelectEpc(epc)}
            hoverZip={hoverZip}
            onHoverZip={setHoverZip}
            onSelectZip3={onSelectZip3}
          />
        </aside>
      </div>
    </div>
  );
}
