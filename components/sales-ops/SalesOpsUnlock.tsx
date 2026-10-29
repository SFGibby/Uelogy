'use client';

import { useEffect, useRef, useState } from 'react';

const SANS = 'var(--font-sales-ops-sans), -apple-system, system-ui, sans-serif';
const SERIF = 'var(--font-sales-ops-serif), Georgia, serif';
const MONO = 'var(--font-sales-ops-mono), ui-monospace, monospace';

export default function SalesOpsUnlock() {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const id = setInterval(() => setTick(t => t + 1), 1200);
    return () => clearInterval(id);
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
      if (res.ok) {
        window.location.reload();
        return;
      }
      setError(res.status === 401 ? 'Access denied.' : 'Something went wrong.');
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  const stamp = new Date();
  const timeStr = stamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#162241',
        color: '#F3F0E8',
        fontFamily: SANS,
        display: 'grid',
        gridTemplateColumns: '1fr',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* subtle grid texture, no gradient */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(transparent 95%, rgba(255,255,255,0.03) 95%), linear-gradient(90deg, transparent 95%, rgba(255,255,255,0.03) 95%)',
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
        }}
      />

      <header
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, background: '#FAD646' }} />
          <span style={{ fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            SunPower<sup style={{ fontSize: 8, marginLeft: 1 }}>&reg;</sup>
            <span style={{ opacity: 0.4, margin: '0 10px' }}>/</span>
            <span>Sales Ops</span>
          </span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', color: '#8B8E99' }}>
          {timeStr}
          <span style={{ opacity: 0.4, margin: '0 8px' }}>·</span>
          BETA
          <span key={tick} style={{ marginLeft: 6, opacity: tick % 2 === 0 ? 1 : 0.2, transition: 'opacity 300ms' }}>
            {'\u25cf'}
          </span>
        </div>
      </header>

      <main
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <form
          onSubmit={submit}
          style={{
            background: '#1D2A4F',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '42px 44px 36px',
            width: 'min(480px, 100%)',
            position: 'relative',
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#8B8E99', marginBottom: 18 }}>
            Access &mdash; Internal
          </div>

          <h1
            style={{
              fontFamily: SERIF,
              fontSize: 44,
              lineHeight: 1,
              margin: '0 0 10px',
              letterSpacing: '-0.01em',
              fontWeight: 400,
            }}
          >
            Where the floor stands,<br />
            <span style={{ fontStyle: 'italic', color: '#FAD646' }}>today</span>.
          </h1>
          <p style={{ margin: '0 0 28px', fontSize: 13, color: '#B6B8C0', lineHeight: 1.55, maxWidth: 360 }}>
            Beta surface for sales execs and regionals. Numbers refresh on sign-in.
          </p>

          <input
            ref={inputRef}
            type="password"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Password"
            style={{
              display: 'block',
              width: '100%',
              padding: '14px 14px',
              background: '#162241',
              color: '#F3F0E8',
              border: '1px solid rgba(255,255,255,0.08)',
              outline: 'none',
              fontFamily: MONO,
              fontSize: 15,
              letterSpacing: '0.16em',
              marginBottom: 14,
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <div style={{ color: '#F43F5E', fontSize: 12, marginBottom: 14, letterSpacing: '0.02em' }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={busy || !value}
            style={{
              background: '#FAD646',
              border: 'none',
              color: '#162241',
              padding: '14px 20px',
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              cursor: busy || !value ? 'not-allowed' : 'pointer',
              opacity: busy || !value ? 0.5 : 1,
              width: '100%',
              transition: 'transform 120ms ease',
            }}
          >
            {busy ? 'Checking' : 'Step onto the floor'}
          </button>

          <div
            style={{
              marginTop: 28,
              paddingTop: 18,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.14em',
              color: '#6b6e78',
              textTransform: 'uppercase',
            }}
          >
            <span>Confidential</span>
            <span>Not for external use</span>
          </div>
        </form>
      </main>
    </div>
  );
}
