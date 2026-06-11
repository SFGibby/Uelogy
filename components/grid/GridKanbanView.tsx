'use client';

// The Grid — Tron-themed project tracker.
// (Extracted from app/grid/page.tsx so the page can be a server component
// that routes between Flynn's exterior, interior, and this view based on cookies.)

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import GridBackground from './GridBackground';
import GridMusic from './GridMusic';
import KanbanBoard from './KanbanBoard';

const Lightcycle = dynamic(() => import('./Lightcycle'), { ssr: false });

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const DISPLAY = '"Geist Mono", "JetBrains Mono", ui-monospace, monospace';

export default function GridKanbanView() {
  const [adminMode, setAdminMode] = useState(false);
  const [gameVisible, setGameVisible] = useState(false);

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

  async function lockAll() {
    await fetch('/api/grid/lock', { method: 'POST' });
    window.location.href = '/grid';
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
          maxWidth: 1280,
          margin: '0 auto',
          padding: '56px 32px 24px',
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
          <span>User Program &middot; {adminMode ? 'Admin' : 'Visitor'}</span>
          <button
            onClick={lockAll}
            style={{
              background: 'transparent',
              border: `1px solid ${CYAN_DIM}`,
              color: CYAN_DIM,
              padding: '4px 10px',
              fontFamily: MONO,
              fontSize: 9,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
            aria-label="Leave Flynn's"
          >
            Exit
          </button>
        </div>
        <h1
          style={{
            fontFamily: DISPLAY,
            fontSize: 'clamp(48px, 8vw, 96px)',
            margin: 0,
            letterSpacing: '0.06em',
            color: CYAN,
            textShadow: '0 0 18px rgba(0,240,255,0.45)',
            lineHeight: 0.95,
            fontWeight: 600,
          }}
        >
          THE&nbsp;GRID
        </h1>
        <p
          style={{
            color: CYAN_DIM,
            maxWidth: 620,
            marginTop: 18,
            fontSize: 14,
            lineHeight: 1.7,
            letterSpacing: '0.02em',
          }}
        >
          A self-imposed board for the projects I am actually running. Stages on the x-axis, types
          as colored tags. Drag to move between stages. {adminMode ? '' : 'Add ?admin=1 to the URL to edit.'}
        </p>
      </section>

      <section
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 1280,
          margin: '0 auto',
          padding: '12px 32px 80px',
        }}
      >
        <KanbanBoard adminMode={adminMode} />
      </section>

      <GridMusic />

      {gameVisible && (
        <Lightcycle onEnd={() => setGameVisible(false)} onSkip={() => setGameVisible(false)} />
      )}

      {!gameVisible && (
        <button
          onClick={() => setGameVisible(true)}
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 50,
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(0,240,255,0.4)',
            color: '#00f0ff',
            padding: '8px 16px',
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          New Game
        </button>
      )}
    </main>
  );
}
