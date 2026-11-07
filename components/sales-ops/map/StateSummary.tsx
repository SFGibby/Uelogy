'use client';

import { useMemo } from 'react';
import type { FilterState, Financier, UtilityRates, Agg, EpcIndex } from './types';
import { METRIC_INDEX } from './types';
import { useEnerfloCoverage } from './useMapData';

const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';

const SURFACE = '#171B38';
const SURFACE_HI = '#1E244A';
const LINE = 'rgba(255,255,255,0.08)';
const LINE_HI = 'rgba(255,255,255,0.14)';
const TEXT = '#FFFFFF';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',
  HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',
  LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',
  MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',
  NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',
  OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',
  WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
};

interface Props {
  filter: FilterState;
  hoverState: string | null;
  utility: UtilityRates | null;
  financiers: Financier[] | null;
  agg: Agg;
  esIndex: EpcIndex;
}

export default function StateSummary({ filter, hoverState, utility, financiers, agg, esIndex }: Props) {
  const enerflo = useEnerfloCoverage();
  const abbr = hoverState ?? filter.stateAbbr;

  const zones = useMemo<number[]>(() => {
    if (!abbr || !enerflo) return [];
    const markets = enerflo.markets.byState[abbr] ?? [];
    return [...new Set(markets.map(m => m.zone))].sort();
  }, [abbr, enerflo]);

  const stateLenders = useMemo<Financier[]>(() => {
    if (!abbr || !financiers) return [];
    return financiers.filter(f => f.states.includes(abbr));
  }, [abbr, financiers]);

  const epcs = useMemo(() => {
    if (!abbr || filter.channel !== 'E') return [];
    const key = `${filter.window}|${filter.inc}|${abbr}`;
    const rows = esIndex.get(key) ?? [];
    return [...rows]
      .map(r => ({
        epc: r.epc,
        installs: Number(r.row[0] ?? 0),
        median: r.row[METRIC_INDEX.med] as number | null,
      }))
      .filter(r => r.installs > 0)
      .sort((a, b) => b.installs - a.installs)
      .slice(0, 8);
  }, [abbr, filter.channel, filter.window, filter.inc, esIndex]);

  const rate = abbr && utility ? utility.rates[abbr] : undefined;
  const rateBand = rate != null && utility
    ? utility.bands.find(b => rate >= b[0] && rate < b[1])?.[2] ?? null
    : null;

  // keep reference so lint doesn't bark; AGG not used here yet but will be when
  // we surface totals like installs-in-state on hover.
  void agg;

  return (
    <section
      style={{
        background: SURFACE,
        border: `1px solid ${LINE_HI}`,
        borderRadius: 12,
        padding: 0,
        marginBottom: 12,
        fontFamily: SANS,
        color: TEXT,
        overflow: 'hidden',
      }}
    >
      <header style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.26em', color: SUN, textTransform: 'uppercase' }}>
          Summary
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: 18, letterSpacing: '-0.01em' }}>
            {abbr ? (STATE_NAMES[abbr] ?? abbr) : 'Hover a state'}
          </h3>
          {abbr && (
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: MUTED, textTransform: 'uppercase' }}>
              {filter.channel === 'D' ? 'Direct view' : 'EPC view'}
            </span>
          )}
        </div>
        {!abbr && (
          <p style={{ margin: '6px 0 0', color: SUBTLE, fontSize: 12, lineHeight: 1.5 }}>
            Hover or click a state to see utility rate, lenders, and EPC footprint.
          </p>
        )}
      </header>

      {abbr && (
        <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Row label="Utility rate">
            {rate != null ? (
              <span>
                <strong style={{ color: TEXT }}>{rate.toFixed(1)}¢ / kWh</strong>
                {rateBand && <span style={{ color: MUTED, marginLeft: 6 }}>· {rateBand}</span>}
              </span>
            ) : (
              <span style={{ color: MUTED }}>Not on file</span>
            )}
          </Row>

          <Row label={`Lenders (${stateLenders.length})`}>
            {stateLenders.length === 0 ? (
              <span style={{ color: MUTED }}>None on file</span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {stateLenders.map(f => (
                  <a
                    key={f.key}
                    href={`/sales-ops/resources?tab=finance`}
                    style={{
                      background: SURFACE_HI, border: `1px solid ${LINE_HI}`,
                      borderRadius: 999, padding: '4px 10px',
                      fontSize: 12, color: SUBTLE, textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {f.name}
                  </a>
                ))}
              </div>
            )}
          </Row>

          {filter.channel === 'D' ? (
            <>
              <Row label={`Working area${zones.length ? ` (${zones.length} zone${zones.length === 1 ? '' : 's'})` : ''}`}>
                {zones.length === 0 ? (
                  <span style={{ color: MUTED }}>Not a working area yet</span>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {zones.map(z => (
                      <span key={z} style={{
                        background: SUN, color: '#0D1023',
                        padding: '3px 9px', borderRadius: 999,
                        fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                      }}>
                        Z{z}
                      </span>
                    ))}
                  </div>
                )}
              </Row>
              <div style={{
                background: SURFACE_HI, border: `1px dashed ${LINE_HI}`, borderRadius: 8,
                padding: '10px 12px', fontSize: 12, color: SUBTLE, lineHeight: 1.5,
              }}>
                Adders and travel ranges apply to the <strong style={{ color: TEXT }}>Direct</strong> channel only.{' '}
                <a href="/sales-ops/resources?tab=adders" style={{ color: SUN, textDecoration: 'underline' }}>
                  Open the adder sheet
                </a>
                .
              </div>
            </>
          ) : (
            <Row label={`EPCs active (${epcs.length})`}>
              {epcs.length === 0 ? (
                <span style={{ color: MUTED }}>None in window</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {epcs.map(r => (
                    <div
                      key={r.epc}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        gap: 10,
                        alignItems: 'baseline',
                        padding: '4px 0',
                        borderBottom: `1px solid ${LINE}`,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.epc}
                      </span>
                      <span style={{ color: SUBTLE, fontFamily: MONO, fontSize: 11 }}>
                        {r.installs.toLocaleString()} inst
                      </span>
                      <span style={{ color: MUTED, fontFamily: MONO, fontSize: 11, minWidth: 48, textAlign: 'right' }}>
                        {r.median != null ? `${Math.round(r.median)} d` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Row>
          )}
        </div>
      )}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: MUTED, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: SUBTLE, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}
