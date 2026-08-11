// Stub in-world "COMING SOON" screen for HUSTLE cabinet. Not a 404 — arcade fiction.

import Link from 'next/link';

export const metadata = {
  title: 'HUSTLE · Coming Soon',
};

export default function HustlePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(120% 80% at 50% 0%, #0a0806 0%, #050403 60%, #000 100%)',
        color: '#ffd700',
        fontFamily: 'var(--font-vt323), ui-monospace, monospace',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: '100%',
          padding: '32px 28px',
          background: '#0b0a06',
          border: '1px solid #4a3810',
          borderRadius: 6,
          boxShadow: `inset 0 0 22px rgba(0,0,0,0.7), 0 0 40px rgba(255,215,0,0.08)`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-press-start), monospace',
            fontSize: 18,
            letterSpacing: '0.16em',
            color: '#ffe680',
            textShadow: '0 0 6px #ffd700, 0 0 18px #ffd70088',
          }}
        >
          HUSTLE
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 22,
            letterSpacing: '0.24em',
            color: '#ffd700',
            animation: 'blink 1.2s steps(2) infinite',
          }}
        >
          COMING SOON
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 15,
            color: '#c9b060',
            lineHeight: 1.5,
            letterSpacing: '0.03em',
          }}
        >
          The client roster + $ counter cabinet.
          <br />
          Not built yet — insert coin later.
        </div>
        <div style={{ marginTop: 28 }}>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              border: '1px solid #ffd70055',
              borderRadius: 3,
              color: '#ffd700',
              textDecoration: 'none',
              fontSize: 14,
              letterSpacing: '0.14em',
            }}
          >
            ← BACK TO ARCADE
          </Link>
        </div>
      </div>
      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.25; }
        }
      `}</style>
    </main>
  );
}
