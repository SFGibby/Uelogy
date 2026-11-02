'use client';

import { useEffect } from 'react';

const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';
const DISPLAY = 'var(--font-gibson-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';

const INK = '#0D1023';
const TEXT = '#FFFFFF';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

/**
 * App-router error boundary scoped to /sales-ops/*. Replaces the default
 * raw error stack with a friendly card + a "try again" button that calls
 * Next's reset(). The real error is still logged to the console so Sam can
 * dig in if something's genuinely broken.
 */
export default function SalesOpsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[sales-ops] error boundary caught:', error);
  }, [error]);

  return (
    <div style={{
      background: INK, color: TEXT, fontFamily: SANS,
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px',
    }}>
      <div style={{ maxWidth: 560, textAlign: 'left' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.3em', color: SUN, textTransform: 'uppercase', marginBottom: 14 }}>
          Something broke
        </div>
        <h1 style={{
          margin: 0,
          fontFamily: DISPLAY,
          fontSize: 'clamp(36px, 6vw, 60px)',
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
        }}>
          Hang on<br />
          <span style={{ color: SUN }}>a second.</span>
        </h1>
        <p style={{ marginTop: 16, color: SUBTLE, fontSize: 15, lineHeight: 1.55 }}>
          Something went sideways loading this view. Try again — if it keeps happening, let Sam know.
        </p>
        {error?.digest && (
          <p style={{ marginTop: 12, fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            trace {error.digest}
          </p>
        )}
        <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              background: SUN, color: '#0D1023', border: 0,
              padding: '12px 22px', borderRadius: 999,
              fontFamily: DISPLAY, fontSize: 13, letterSpacing: '0.14em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <a
            href="/sales-ops"
            style={{
              background: 'transparent', color: SUBTLE,
              border: `1px solid rgba(255,255,255,0.14)`, borderRadius: 999,
              padding: '12px 22px', textDecoration: 'none',
              fontFamily: 'var(--font-gibson-mono), ui-monospace, monospace',
              fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            }}
          >
            Back to Sales Ops
          </a>
        </div>
      </div>
    </div>
  );
}
