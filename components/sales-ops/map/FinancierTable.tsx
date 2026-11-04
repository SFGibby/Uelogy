'use client';

import Link from 'next/link';
import type { Financier } from './types';

const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';
const DISPLAY = 'var(--font-gibson-display), "Archivo Black", Impact, sans-serif';

const SURFACE = '#171B38';
const LINE = 'rgba(255,255,255,0.08)';
const LINE_HI = 'rgba(255,255,255,0.14)';
const TEXT = '#FFFFFF';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

interface Props {
  stateAbbr: string;
  financiers: Financier[] | null;
}

/**
 * Compact lender list for the drilled-state view. Shows which financiers are
 * active in the state and links out to the Finance tab in Resources for the
 * full rules (FICO, DTI, home-type restrictions, NTP, etc.) so we're not
 * duplicating that content here.
 */
export default function FinancierTable({ stateAbbr, financiers }: Props) {
  if (!financiers) return null;
  const active = financiers.filter(f => f.states.includes(stateAbbr));
  if (active.length === 0) return null;

  return (
    <section style={{ padding: '4px 20px 12px', fontFamily: SANS, color: TEXT }}>
      <div style={{
        background: SURFACE, border: `1px solid ${LINE_HI}`, borderRadius: 10,
        padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Lenders in {stateAbbr}
          </h3>
          <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {active.length} active
          </span>
          <Link
            href="/sales-ops/resources?tab=finance"
            style={{
              marginLeft: 'auto',
              color: SUN, fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em',
              textTransform: 'uppercase', textDecoration: 'none',
              borderBottom: '1px solid rgba(250,214,70,0.4)', paddingBottom: 1,
            }}
          >
            Open finance tab &rsaquo;
          </Link>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {active.map(f => (
            <span
              key={f.key}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${LINE_HI}`,
                borderRadius: 999,
                padding: '6px 12px',
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '0.1em',
                color: SUBTLE,
              }}
            >
              {f.name}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Underwriting rules live in the Finance tab.
        </div>
      </div>
      <style>{`section + section { border-top: 0; }`}</style>
    </section>
  );
}
