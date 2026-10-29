'use client';

import { useEffect, useRef, useState } from 'react';

const SANS = 'Arial, Helvetica, sans-serif';
const MONO = 'ui-monospace, Menlo, Consolas, monospace';

const INK = '#162241';
const SURFACE = '#1A2648';
const LINE = '#26355f';
const LINE_HI = '#33436e';
const TEXT = '#ffffff';
const SUBTLE = '#cfd5e2';
const MUTED = '#9aa3b5';
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

  return (
    <div style={{ minHeight: '100vh', background: INK, color: TEXT, fontFamily: SANS, display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '14px 20px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, background: SUN }} />
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>
          SunPower<sup style={{ fontSize: 8 }}>&reg;</sup>
        </span>
        <span style={{ width: 1, height: 16, background: LINE }} />
        <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
          Sales Ops &middot; Access
        </span>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <form onSubmit={submit} style={{ width: 'min(420px, 100%)' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.04em', marginBottom: 10 }}>
            Internal access required
          </div>
          <h1 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 700, color: TEXT, letterSpacing: '-0.005em' }}>
            Sales Ops
          </h1>
          <p style={{ margin: '0 0 22px', fontSize: 13, color: SUBTLE, lineHeight: 1.5 }}>
            Beta surface for Direct Ops transparency. Numbers refresh on sign-in.
          </p>

          <label htmlFor="password" style={{ display: 'block', fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.04em', marginBottom: 6 }}>
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
              padding: '12px 14px',
              background: SURFACE,
              color: TEXT,
              border: `1px solid ${LINE_HI}`,
              borderRadius: 4,
              outline: 'none',
              fontFamily: SANS,
              fontSize: 14,
              marginBottom: 14,
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <div style={{ color: '#ff8a8a', fontSize: 12, marginBottom: 14 }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={busy || !value}
            style={{
              background: SUN,
              color: INK,
              border: 0,
              borderRadius: 4,
              padding: '12px 22px',
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: 700,
              cursor: busy || !value ? 'not-allowed' : 'pointer',
              opacity: busy || !value ? 0.5 : 1,
              width: '100%',
            }}
          >
            {busy ? 'Checking\u2026' : 'Enter'}
          </button>

          <div style={{ marginTop: 22, paddingTop: 14, borderTop: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.04em' }}>
            <span>Confidential</span>
            <span>Internal use only</span>
          </div>
        </form>
      </main>
    </div>
  );
}
