'use client';

import type { FilterState, UtilityRates, Financier } from './types';
import { METRICS } from './types';

const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';

const INK = '#0D1023';
const SURFACE = '#171B38';
const LINE_HI = 'rgba(255,255,255,0.14)';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

const SPEED_GRADIENT = 'linear-gradient(90deg, rgb(255,112,70) 0%, rgb(255,160,70) 32%, rgb(250,214,70) 55%, rgb(168,220,90) 75%, rgb(94,228,147) 100%)';
const RATE_GRADIENT = 'linear-gradient(90deg, rgba(84,140,220,0.18) 0%, rgba(84,140,220,0.72) 100%)';
const FIN_GRADIENT = 'linear-gradient(90deg, rgba(94,228,147,0.20) 0%, rgba(94,228,147,0.66) 100%)';

interface Props {
  filter: FilterState;
  utility: UtilityRates | null;
  financiers: Financier[] | null;
}

/**
 * Always-visible legend strip that sits below the map. Compact horizontal
 * row of swatches with tiny labels so the reader can decode every symbol at
 * a glance without blocking the canvas.
 */
export default function LegendNote({ filter, financiers }: Props) {
  const activeMetric = METRICS.find(m => m.key === filter.metric)?.label ?? 'install metric';
  const financierName: string | null = filter.financierFilter
    ? (financiers?.find(f => f.key === filter.financierFilter)?.name ?? null)
    : null;

  const shadingItem = filter.stateShading === 'metric'
    ? { swatch: <Bar gradient={SPEED_GRADIENT} />, title: activeMetric, hint: 'Slow → Fast' }
    : filter.stateShading === 'rate'
      ? { swatch: <Bar gradient={RATE_GRADIENT} />, title: 'Utility rate', hint: '¢/kWh, 4 bands' }
      : financierName
        ? { swatch: <SolidSwatch color="rgba(94,228,147,0.66)" border="rgba(94,228,147,0.9)" />, title: `${financierName} coverage`, hint: 'Green = covered' }
        : { swatch: <Bar gradient={FIN_GRADIENT} />, title: 'Lender count', hint: '1 · 2 · 3+' };
  const items: Array<{ swatch: React.ReactNode; title: string; hint: string }> = [
    shadingItem,
    { swatch: <SolidSwatch color="rgba(250,214,70,0.28)" border="rgba(250,214,70,0.55)" />, title: 'Workable area', hint: 'Direct, no installs yet' },
    { swatch: <HatchSwatch />, title: 'Not serviced', hint: 'Opacity = DQ ratio' },
  ];

  const caption = buildCaption({ filter, financierName, activeMetric });

  return (
    <div
      style={{
        marginTop: 10,
        background: SURFACE,
        border: `1px solid ${LINE_HI}`,
        borderRadius: 10,
        fontFamily: SANS,
        color: SUBTLE,
      }}
    >
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '14px 22px',
        alignItems: 'center', padding: '12px 18px',
      }}>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.26em', color: SUN, textTransform: 'uppercase' }}>
          Legend
        </span>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {it.swatch}
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: SUBTLE, textTransform: 'uppercase' }}>
                {it.title}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase', marginTop: 2 }}>
                {it.hint}
              </span>
            </span>
          </div>
        ))}
      </div>
      <div style={{
        padding: '10px 18px',
        borderTop: `1px solid ${LINE_HI}`,
        fontSize: 12,
        color: SUBTLE,
        lineHeight: 1.5,
      }}>
        {caption}
      </div>
    </div>
  );
}

function buildCaption({ filter, financierName, activeMetric }: { filter: FilterState; financierName: string | null; activeMetric: string }): string {
  const channel = filter.channel === 'D' ? 'Direct' : 'EPC';
  const win = filter.window === '3' ? '3-month' : filter.window === '6' ? '6-month' : '12-month';
  const parts: string[] = [`${channel} channel, ${win} window.`];
  if (filter.stateShading === 'metric') parts.push(`States shaded by ${activeMetric.toLowerCase()} speed (slow → fast).`);
  else if (filter.stateShading === 'rate') parts.push('States shaded by utility rate (¢/kWh).');
  else if (filter.stateShading === 'financier') {
    parts.push(financierName ? `States with ${financierName} coverage highlighted.` : 'States shaded by number of lenders (1 · 2 · 3+).');
  }
  parts.push('Yellow = workable, hatched = not serviced.');
  return parts.join(' ');
}

function Bar({ gradient }: { gradient: string }) {
  return (
    <div style={{
      width: 36, height: 10, borderRadius: 4,
      background: gradient,
      border: `1px solid ${INK}`,
      flexShrink: 0,
    }} />
  );
}

function SolidSwatch({ color, border }: { color: string; border: string }) {
  return (
    <div style={{
      width: 20, height: 16, borderRadius: 4,
      background: color, border: `1px solid ${border}`,
      flexShrink: 0,
    }} />
  );
}

function HatchSwatch() {
  return (
    <div style={{
      width: 20, height: 16, borderRadius: 4,
      background: 'repeating-linear-gradient(45deg, rgba(13,16,35,0.9) 0 1.2px, rgba(255,255,255,0.18) 1.2px 5px)',
      border: `1px solid ${LINE_HI}`,
      flexShrink: 0,
    }} />
  );
}

