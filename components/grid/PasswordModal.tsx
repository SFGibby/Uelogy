'use client';

import { useEffect, useRef, useState } from 'react';

type Gate = 'flynns' | 'tron';

interface Props {
  gate: Gate;
  title: string;
  hint?: string;
  accent?: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function PasswordModal({
  gate,
  title,
  hint,
  accent = '#00f0ff',
  open,
  onClose,
  onSuccess,
}: Props) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue('');
      setError(null);
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/grid/unlock', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ gate, password: value }),
      });
      if (res.ok) {
        await onSuccess();
        return;
      }
      setError(res.status === 401 ? 'Access denied.' : 'Something went sideways.');
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(2px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{
          background: '#0a0e12',
          border: `1px solid ${accent}`,
          boxShadow: `0 0 24px ${accent}66, inset 0 0 12px ${accent}22`,
          padding: '28px 28px 24px',
          width: 'min(420px, 100%)',
          fontFamily: MONO,
          color: accent,
          transform: shake ? 'translateX(0)' : 'none',
          animation: shake ? 'pm-shake 0.4s' : undefined,
        }}
      >
        <style>{`
          @keyframes pm-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
          }
        `}</style>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.36em',
            textTransform: 'uppercase',
            opacity: 0.7,
            marginBottom: 8,
          }}
        >
          Authorization required
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, letterSpacing: '0.04em' }}>{title}</h2>
        {hint && (
          <p style={{ margin: '6px 0 18px', fontSize: 12, opacity: 0.6, lineHeight: 1.5 }}>{hint}</p>
        )}
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
            padding: '10px 12px',
            background: '#000',
            color: accent,
            border: `1px solid ${accent}66`,
            outline: 'none',
            fontFamily: MONO,
            fontSize: 16,
            letterSpacing: '0.18em',
            marginBottom: 12,
          }}
        />
        {error && (
          <div style={{ color: '#ff5a5a', fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              background: 'transparent',
              border: `1px solid ${accent}44`,
              color: accent,
              padding: '8px 14px',
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !value}
            style={{
              background: accent,
              border: `1px solid ${accent}`,
              color: '#000',
              padding: '8px 18px',
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: busy || !value ? 'not-allowed' : 'pointer',
              opacity: busy || !value ? 0.6 : 1,
            }}
          >
            {busy ? 'Checking…' : 'Enter'}
          </button>
        </div>
      </form>
    </div>
  );
}
