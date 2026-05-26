'use client';

// The Grid — Tron-themed project tracker.

import { useState, useEffect } from 'react';
import GridBackground from '../../components/grid/GridBackground';
import GridMusic from '../../components/grid/GridMusic';
import KanbanBoard from '../../components/grid/KanbanBoard';

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const DISPLAY = '"Geist Mono", "JetBrains Mono", ui-monospace, monospace';

export default function GridPage() {
  const [adminMode, setAdminMode] = useState(false);

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
          }}
        >
          User Program &middot; {adminMode ? 'Admin' : 'Visitor'}
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
    </main>
  );
}
