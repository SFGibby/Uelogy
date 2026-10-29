'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const INK = '#162241';
const TEXT = '#FFFFFF';
const MUTED = '#8A96B5';
const LINE = 'rgba(255,255,255,0.1)';
const SUN = '#FAD646';
const DISPLAY = 'var(--font-sales-ops-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-sales-ops-mono), ui-monospace, monospace';

const NAV = [
  { key: 'map', label: 'Map', href: '/sales-ops/map' },
  { key: 'pulse', label: 'Pulse', href: '/sales-ops/pulse' },
  { key: 'resources', label: 'Resources', href: '/sales-ops/resources' },
  { key: 'feedback', label: 'Feedback', href: '/sales-ops/feedback' },
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
        fontFamily: MONO,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ display: 'inline-block', width: 12, height: 12, background: SUN }} />
        <span style={{ fontFamily: DISPLAY, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT }}>
          SunPower<sup style={{ fontSize: 8 }}>&reg;</sup> &middot; Sales Ops
        </span>
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 20 }}>
        {NAV.map(item => {
          const active = path?.startsWith(item.href) ?? false;
          const style: React.CSSProperties = {
            padding: '9px 14px',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            color: active ? SUN : TEXT,
            borderBottom: active ? `2px solid ${SUN}` : '2px solid transparent',
            pointerEvents: 'auto',
            fontWeight: active ? 600 : 400,
          };
          return (
            <Link key={item.key} href={item.href} style={style}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <button
        onClick={lock}
        style={{
          background: 'transparent',
          border: `1px solid ${LINE}`,
          color: MUTED,
          padding: '8px 14px',
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Lock
      </button>
    </header>
  );
}
