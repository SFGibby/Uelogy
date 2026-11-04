'use client';

import type { ReactNode } from 'react';

const INK = '#0D1023';
const LINE_HI = 'rgba(255,255,255,0.14)';
const TEXT = '#FFFFFF';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';
const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';

const VERDICT_BG = {
  good: 'rgba(94, 228, 147, 0.18)',
  caution: 'rgba(253, 177, 70, 0.18)',
  dq: 'rgba(255, 112, 70, 0.18)',
} as const;

const VERDICT_FG = {
  good: '#5EE493',
  caution: '#FDB146',
  dq: '#FF7046',
} as const;

export interface TooltipFlag { k: 'good' | 'warn' | 'bad'; t: string; }

export interface TooltipContent {
  title: string;
  chip?: { label: string; kind: 'good' | 'caution' | 'dq' };
  lines?: Array<{ label: string; value: string }>;
  flags?: TooltipFlag[];
  footnote?: string;
}

interface Props {
  content: TooltipContent | null;
  x: number;
  y: number;
  containerRect: DOMRect | null;
}

export default function MapTooltip({ content, x, y, containerRect }: Props) {
  if (!content || !containerRect) return null;

  // Keep the tooltip inside the map container — flip to the left/above when the
  // cursor is near the right/bottom edge.
  const TW = 280;
  const TH = 160;
  const pad = 14;
  const flipX = x + TW + pad > containerRect.width;
  const flipY = y + TH + pad > containerRect.height;
  const left = flipX ? x - TW - pad : x + pad;
  const top = flipY ? y - TH - pad : y + pad;

  const flagColor = (k: 'good' | 'warn' | 'bad') =>
    k === 'good' ? VERDICT_FG.good : k === 'warn' ? VERDICT_FG.caution : VERDICT_FG.dq;

  return (
    <div
      style={{
        position: 'absolute',
        left: Math.max(6, left),
        top: Math.max(6, top),
        minWidth: 180,
        maxWidth: TW,
        padding: '10px 12px',
        background: 'rgba(13, 16, 35, 0.94)',
        border: `1px solid ${LINE_HI}`,
        borderRadius: 10,
        fontFamily: SANS,
        color: TEXT,
        pointerEvents: 'none',
        zIndex: 20,
        boxShadow: '0 12px 24px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: content.chip ? 4 : 2 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', color: SUN, textTransform: 'uppercase', flex: 1, minWidth: 0 }}>
          {content.title}
        </div>
        {content.chip && (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: 999,
              background: VERDICT_BG[content.chip.kind],
              color: VERDICT_FG[content.chip.kind],
              whiteSpace: 'nowrap',
            }}
          >
            {content.chip.label}
          </span>
        )}
      </div>
      {content.lines && content.lines.length > 0 && (
        <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 10, rowGap: 3, fontSize: 12 }}>
          {content.lines.map((l, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <div style={{ color: MUTED, fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {l.label}
              </div>
              <div style={{ color: SUBTLE, fontWeight: 500 }}>{l.value}</div>
            </div>
          ))}
        </div>
      )}
      {content.flags && content.flags.length > 0 && (
        <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {content.flags.map((f, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, lineHeight: 1.35, color: SUBTLE }}>
              <span style={{ marginTop: 5, width: 6, height: 6, borderRadius: 999, background: flagColor(f.k), flexShrink: 0 }} />
              <span>{f.t}</span>
            </li>
          ))}
        </ul>
      )}
      {content.footnote && (
        <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>
          {content.footnote}
        </div>
      )}
    </div>
  );
}
