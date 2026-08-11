'use client';

// Glowing green EXIT sign. Click opens a small panel with social links + email.
// Replaces the standalone SocialNeons section.

import { useEffect, useRef, useState } from 'react';

export interface ExitSignProps {
  socials: { label: string; href: string }[];
  email?: string;
}

export default function ExitSign({ socials, email }: ExitSignProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="exit-panel"
        style={{
          appearance: 'none',
          background: '#0d1a10',
          border: '2px solid #33ff33',
          borderRadius: 4,
          padding: '12px 28px',
          fontFamily: 'var(--font-press-start), monospace',
          fontSize: 16,
          letterSpacing: '0.28em',
          color: '#c9ffd0',
          textShadow:
            '0 0 4px #33ff33, 0 0 10px #33ff33dd, 0 0 22px #33ff3388',
          boxShadow:
            'inset 0 0 12px rgba(51,255,51,0.15), 0 0 18px rgba(51,255,51,0.25)',
          cursor: 'pointer',
        }}
      >
        EXIT
      </button>

      <div
        ref={panelRef}
        id="exit-panel"
        role="dialog"
        aria-label="Contact links"
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 14px)',
          left: '50%',
          transform: `translateX(-50%) translateY(${open ? '0' : '8px'})`,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 180ms ease, transform 180ms ease',
          minWidth: 260,
          background: '#0a0a10',
          border: '1px solid #33ff3355',
          borderRadius: 4,
          padding: '14px 16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 24px rgba(51,255,51,0.15)',
          zIndex: 20,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-vt323), monospace',
            fontSize: 12,
            letterSpacing: '0.32em',
            color: 'rgba(201,255,208,0.7)',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Out this way
        </div>
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gap: 6,
          }}
        >
          {socials.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '4px 6px',
                  color: '#c9ffd0',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-vt323), monospace',
                  fontSize: 16,
                  letterSpacing: '0.06em',
                  borderLeft: '2px solid transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderLeftColor = '#33ff33')}
                onMouseLeave={(e) => (e.currentTarget.style.borderLeftColor = 'transparent')}
              >
                {s.label}
              </a>
            </li>
          ))}
          {email && (
            <li style={{ marginTop: 6, paddingTop: 8, borderTop: '1px solid #33ff3322' }}>
              <a
                href={`mailto:${email}`}
                style={{
                  display: 'block',
                  padding: '4px 6px',
                  color: '#c9ffd0',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-vt323), monospace',
                  fontSize: 16,
                  letterSpacing: '0.06em',
                }}
              >
                {email}
              </a>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
