'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SunPowerMark from './SunPowerMark';
import UniversalSearch from './UniversalSearch';

const INK = '#162241';
const SUBTLE = '#cfd5e2';
const MUTED = '#9aa3b5';
const LINE = '#26355f';
const SUN = '#FAD646';
const SANS = 'Arial, Helvetica, sans-serif';
const MONO = 'ui-monospace, Menlo, Consolas, monospace';

const NAV = [
  { key: 'map', label: 'Map', href: '/sales-ops/map' },
  { key: 'pulse', label: 'Pulse', href: '/sales-ops/pulse' },
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
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        fontFamily: SANS,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <SunPowerMark height={18} />
        <span style={{ width: 1, height: 16, background: LINE }} />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.04em', color: MUTED }}>
          Sales Ops
        </span>
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 10 }}>
        {NAV.map(item => {
          const active = path?.startsWith(item.href) ?? false;
          const style: React.CSSProperties = {
            padding: '8px 12px',
            fontSize: 13,
            textDecoration: 'none',
            color: active ? SUN : SUBTLE,
            borderBottom: active ? `2px solid ${SUN}` : '2px solid transparent',
            fontWeight: active ? 700 : 400,
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
          border: `1px solid ${LINE}`,
          borderRadius: 4,
          color: MUTED,
          padding: '7px 12px',
          fontFamily: SANS,
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        Lock
      </button>
    </header>
  );
}
