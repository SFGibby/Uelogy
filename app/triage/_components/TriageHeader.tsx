'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SUBNAV = [
  { href: '/triage', label: 'Triage' },
  { href: '/triage/faq', label: 'FAQ' },
  { href: '/triage/directory', label: 'Directory' },
  { href: '/triage/reference', label: 'Reference' },
  { href: '/triage/brainstorm', label: 'Brain Storm' },
];

export default function TriageHeader() {
  const pathname = usePathname();
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'rgba(5, 7, 12, 0.85)',
        borderBottom: '1px solid var(--sp-ink-3)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          flexWrap: 'wrap',
        }}
      >
        <Link href="/triage" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/sunpower/logo-white.svg"
            alt="SunPower"
            style={{ height: 20, width: 'auto', display: 'block' }}
          />
          <span
            style={{
              fontSize: 12,
              letterSpacing: '0.14em',
              color: 'var(--sp-text-lo)',
              fontWeight: 600,
              textTransform: 'uppercase',
              borderLeft: '1px solid var(--sp-ink-4)',
              paddingLeft: 12,
            }}
          >
            Triage
          </span>
        </Link>
        <nav style={{ display: 'flex', gap: 4, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {SUBNAV.map((item) => {
            const active =
              item.href === '/triage'
                ? pathname === '/triage'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '8px 14px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? 'var(--sp-text-hi)' : 'var(--sp-text-md)',
                  background: active ? 'var(--sp-ink-2)' : 'transparent',
                  borderRadius: 8,
                  textDecoration: 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
