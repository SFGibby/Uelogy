'use client';

// The Grid — Tron-themed project tracker. This file is the skeleton: layout,
// hero, and background only. The kanban board, lightcycle game intro, and
// admin modals follow in subsequent commits.

import GridBackground from '../../components/grid/GridBackground';
import GridMusic from '../../components/grid/GridMusic';

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const CYAN_FAINT = 'rgba(0,240,255,0.18)';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const DISPLAY = '"Geist Mono", "JetBrains Mono", ui-monospace, monospace';

export default function GridPage() {
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

      {/* Hero */}
      <section
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 1180,
          margin: '0 auto',
          padding: '60px 32px 40px',
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
          User Program · Authenticated
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
            maxWidth: 580,
            marginTop: 20,
            fontSize: 14,
            lineHeight: 1.7,
            letterSpacing: '0.02em',
          }}
        >
          A self-imposed board for the projects I am actually running. Stages on the x-axis, types as
          tags, due dates when they matter. Public read; admin gate flips edit mode on.
        </p>
      </section>

      {/* Placeholder board area — the real kanban replaces this in B4 */}
      <section
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 1180,
          margin: '0 auto',
          padding: '20px 32px 80px',
        }}
      >
        <div
          style={{
            position: 'relative',
            padding: '40px 36px',
            border: `1px solid ${CYAN_FAINT}`,
            background: 'rgba(0,12,16,0.55)',
            // Chamfered top-right corner using clip-path
            clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
            boxShadow: `0 0 24px rgba(0,240,255,0.10), inset 0 0 0 1px rgba(0,240,255,0.04)`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.36em',
              color: CYAN_DIM,
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            System &middot; Status
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 22,
              color: CYAN,
              fontFamily: DISPLAY,
              letterSpacing: '0.04em',
            }}
          >
            Board initialization queued.
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: CYAN_DIM,
              lineHeight: 1.7,
              maxWidth: 540,
            }}
          >
            Stages, types, and tasks will live here. Visitors will see the board read-only. Adding
            <code style={{ background: 'rgba(0,240,255,0.08)', padding: '1px 6px', margin: '0 4px', color: CYAN }}>?admin=1</code>
            to the URL flips management mode on.
          </div>
        </div>
      </section>

      <GridMusic />
    </main>
  );
}
