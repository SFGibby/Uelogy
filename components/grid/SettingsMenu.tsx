'use client';

// Small settings gear that opens a menu of admin actions.
// Replaces the "Manage Stages / Manage Owners" strip.

import { useState, useEffect, useRef } from 'react';

interface Props {
  onManageStages: () => void;
  onManageOwners: () => void;
}

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const CYAN_FAINT = 'rgba(0,240,255,0.22)';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function SettingsMenu({ onManageStages, onManageOwners }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        title="Settings"
        style={{
          background: 'transparent',
          border: 'none',
          color: open ? CYAN : CYAN_DIM,
          fontFamily: MONO,
          fontSize: 18,
          lineHeight: 1,
          padding: '2px 4px',
          cursor: 'pointer',
          textShadow: open ? `0 0 8px ${CYAN}` : 'none',
          transition: 'text-shadow 0.15s',
        }}
      >
        ⚙
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 30,
            background: '#020608',
            border: `1px solid ${CYAN_FAINT}`,
            minWidth: 180,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onManageStages();
            }}
            style={itemStyle}
          >
            Manage Stages
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onManageOwners();
            }}
            style={itemStyle}
          >
            Manage Owners
          </button>
        </div>
      )}
    </div>
  );
}

const itemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '10px 14px',
  background: 'transparent',
  border: 'none',
  borderBottom: `1px solid ${CYAN_FAINT}`,
  color: CYAN_DIM,
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  fontWeight: 700,
  textAlign: 'left',
  cursor: 'pointer',
};
