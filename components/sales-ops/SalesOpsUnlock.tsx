'use client';

import { useEffect, useRef, useState } from 'react';
import SunPowerMark from './SunPowerMark';

const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';
const DISPLAY = 'var(--font-gibson-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';

const INK = '#0D1023';
const SURFACE = '#171B38';
const LINE = 'rgba(255,255,255,0.08)';
const LINE_HI = 'rgba(255,255,255,0.14)';
const TEXT = '#FFFFFF';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

export default function SalesOpsUnlock() {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/grid/unlock', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ gate: 'sales_ops', password: value }),
      });
      if (res.ok) { window.location.reload(); return; }
      setError(res.status === 401 ? 'Access denied.' : 'Something went wrong.');
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: INK, color: TEXT, fontFamily: SANS, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 60% 60% at 85% 20%, rgba(250,214,70,0.14), transparent 65%),' +
            'radial-gradient(ellipse 50% 60% at 10% 100%, rgba(250,109,29,0.08), transparent 65%)',
        }}
      />

      <header style={{ padding: '18px 24px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
        <SunPowerMark height={20} />
        <span style={{ width: 1, height: 20, background: LINE_HI }} />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.28em', color: MUTED, textTransform: 'uppercase' }}>
          Sales Ops &middot; Access
        </span>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, position: 'relative' }}>
        <form onSubmit={submit} style={{ width: 'min(480px, 100%)' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: SUN, letterSpacing: '0.3em', marginBottom: 14, textTransform: 'uppercase' }}>
            Internal access
          </div>
          <h1 style={{ margin: '0 0 16px', fontFamily: DISPLAY, fontSize: 'clamp(44px, 7vw, 80px)', lineHeight: 0.92, letterSpacing: '-0.02em', textTransform: 'uppercase', color: TEXT }}>
            Sales Ops
          </h1>
          <p style={{ margin: '0 0 28px', fontSize: 15, color: SUBTLE, lineHeight: 1.55, maxWidth: 420 }}>
            Beta surface for Direct Ops transparency. Password lands you on the live map.
          </p>

          <label htmlFor="password" style={{ display: 'block', fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.22em', marginBottom: 8, textTransform: 'uppercase' }}>
            Password
          </label>
          <input
            id="password"
            ref={inputRef}
            type="password"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{
              display: 'block',
              width: '100%',
              padding: '14px 18px',
              background: SURFACE,
              color: TEXT,
              border: `1px solid ${LINE_HI}`,
              borderRadius: 999,
              outline: 'none',
              fontFamily: SANS,
              fontSize: 15,
              marginBottom: 16,
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <div style={{ color: '#FF8B9F', fontSize: 13, marginBottom: 16 }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={busy || !value}
            style={{
              background: SUN,
              color: INK,
              border: 0,
              borderRadius: 999,
              padding: '14px 28px',
              fontFamily: DISPLAY,
              fontSize: 14,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: busy || !value ? 'not-allowed' : 'pointer',
              opacity: busy || !value ? 0.5 : 1,
              width: '100%',
            }}
          >
            {busy ? 'Checking\u2026' : 'Enter'}
          </button>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${LINE_HI}`, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            <span>Confidential</span>
            <span>Internal only</span>
          </div>
        </form>
      </main>
    </div>
  );
}
