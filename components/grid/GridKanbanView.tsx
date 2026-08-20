'use client';

// The Grid — Tron-themed project tracker.
// Rendered inside GridEntry after Digitize + Lightcycle run.

import { useState, useEffect } from 'react';
import GridBackground from './GridBackground';
import GridMusic from './GridMusic';
import KanbanBoard from './KanbanBoard';
import SettingsMenu from './SettingsMenu';

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function GridKanbanView() {
  const [adminMode, setAdminMode] = useState(false);
  const [openStageManager, setOpenStageManager] = useState(false);
  const [openTypeManager, setOpenTypeManager] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const a = params.get('admin');
    if (a === '1') {
      localStorage.setItem('grid_admin', '1');
      setAdminMode(true);
    } else if (a === '0') {
      localStorage.removeItem('grid_admin');
      setAdminMode(false);
    } else {
      setAdminMode(localStorage.getItem('grid_admin') === '1');
    }
  }, []);

  async function exitToHome() {
    await fetch('/api/grid/lock', { method: 'POST' });
    window.location.href = '/';
  }

  return (
    <main
      style={{
        background: '#000',
        color: CYAN,
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: MONO,
      }}
    >
      <GridBackground />

      <section
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 1800,
          margin: '0 auto',
          padding: 'clamp(24px, 4vw, 48px) clamp(16px, 2.5vw, 28px) 16px',
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.36em',
            color: CYAN_DIM,
            textTransform: 'uppercase',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            {adminMode && (
              <SettingsMenu
                onManageStages={() => setOpenStageManager(true)}
                onManageOwners={() => setOpenTypeManager(true)}
              />
            )}
            <span style={{ lineHeight: 1 }}>
              User Program &middot; {adminMode ? 'Admin' : 'Visitor'}
            </span>
          </div>
          <button
            onClick={exitToHome}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffe1c8',
              padding: '2px 6px',
              fontFamily: '"Geist Mono", ui-monospace, monospace',
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              minHeight: 44,
              textShadow:
                '0 0 6px #ff8a3a, 0 0 18px #ff6a18, 0 0 34px rgba(255,106,24,0.55)',
              textTransform: 'uppercase',
            }}
            aria-label="Exit to Sam's"
          >
            Sam&apos;s
          </button>
        </div>
      </section>

      <section
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 1800,
          margin: '0 auto',
          padding: '8px clamp(16px, 2.5vw, 28px) 80px',
        }}
      >
        <KanbanBoard
          adminMode={adminMode}
          openStageManager={openStageManager}
          openTypeManager={openTypeManager}
          onStageManagerClose={() => setOpenStageManager(false)}
          onTypeManagerClose={() => setOpenTypeManager(false)}
        />
      </section>

      <GridMusic />
    </main>
  );
}
