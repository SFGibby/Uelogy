'use client';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'HOME' },
  { href: '/learning', label: 'LEARNING' },
  { href: '/collection', label: 'COLLECTION' },
  { href: '/grid', label: 'THE GRID' },
  { href: '/triage', label: 'TRIAGE' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav style={{
      background: '#111',
      borderBottom: '1px solid #222',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '14px 24px',
        display: 'flex',
        gap: '28px',
        alignItems: 'center',
      }}>
        {LINKS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <a key={href} href={href} style={{
              color: active ? '#fff' : '#888',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: active ? 600 : 400,
              letterSpacing: '0.03em',
            }}>
              {label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
