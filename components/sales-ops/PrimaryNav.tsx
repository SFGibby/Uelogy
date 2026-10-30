'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SunPowerMark from './SunPowerMark';
import UniversalSearch from './UniversalSearch';

const INK = '#0D1023';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const LINE = 'rgba(255,255,255,0.08)';
const LINE_HI = 'rgba(255,255,255,0.14)';
const SUN = '#FAD646';
const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';
const DISPLAY = 'var(--font-gibson-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';

const NAV = [
  { key: 'map', label: 'Map', href: '/sales-ops/map' },
  { key: 'scorecard', label: 'Scorecard', href: '/sales-ops/scorecard' },
  { key: 'resources', label: 'Resources', href: '/sales-ops/resources' },
];

export default function PrimaryNav() {
  const path = usePathname();

  async function lock() {
    await fetch('/api/grid/lock', { method: 'POST' });
    window.location.href = '/';
  }

  return (
    <header
      style={{
        background: INK,
        borderBottom: `1px solid ${LINE}`,
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        fontFamily: SANS,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <SunPowerMark height={20} />
        <span style={{ width: 1, height: 20, background: LINE_HI }} />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.28em', color: MUTED, textTransform: 'uppercase' }}>
          Sales Ops
        </span>
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 10 }}>
        {NAV.map(item => {
          const active = path?.startsWith(item.href) ?? false;
          const style: React.CSSProperties = {
            padding: '10px 16px',
            fontFamily: DISPLAY,
            fontSize: 13,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            color: active ? SUN : SUBTLE,
            borderBottom: active ? `2px solid ${SUN}` : '2px solid transparent',
            marginBottom: -1,
          };
          return (
            <Link key={item.key} href={item.href} style={style}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <UniversalSearch />
      </div>

      <button
        onClick={lock}
        style={{
          background: 'transparent',
          border: `1px solid ${LINE_HI}`,
          borderRadius: 999,
          color: SUBTLE,
          padding: '9px 18px',
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Lock
      </button>
    </header>
  );
}
