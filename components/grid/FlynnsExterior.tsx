'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PasswordModal from './PasswordModal';

const ORANGE = '#ff6a18';
const ORANGE_DIM = 'rgba(255,106,24,0.7)';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const DISPLAY = '"Geist Mono", "JetBrains Mono", ui-monospace, monospace';

export default function FlynnsExterior() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(120% 80% at 50% 110%, #1a0a05 0%, #0a0507 55%, #000 100%)',
        position: 'relative',
        overflow: 'hidden',
        color: ORANGE,
        fontFamily: MONO,
      }}
    >
      {/* night sky */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(1px 1px at 20% 18%, #fff 0%, transparent 50%), radial-gradient(1px 1px at 65% 22%, #ddd 0%, transparent 50%), radial-gradient(1px 1px at 82% 12%, #fff 0%, transparent 50%), radial-gradient(1px 1px at 40% 8%, #ccc 0%, transparent 50%), radial-gradient(1px 1px at 12% 30%, #fff 0%, transparent 50%)',
          opacity: 0.7,
        }}
      />

      {/* sidewalk */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '24vh',
          background:
            'repeating-linear-gradient(90deg, #161616 0 80px, #1c1c1c 80px 160px), linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
          borderTop: '2px solid #2a2a2a',
        }}
      />

      {/* brick building face */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '20vh',
          transform: 'translateX(-50%)',
          width: 'min(640px, 92vw)',
          height: '62vh',
          background:
            'repeating-linear-gradient(0deg, #2a1410 0 12px, #1f0c08 12px 14px), repeating-linear-gradient(90deg, transparent 0 60px, rgba(0,0,0,0.4) 60px 62px)',
          borderTop: '2px solid #4a2a20',
          boxShadow:
            'inset 0 -40px 80px rgba(255,106,24,0.25), inset 0 0 0 2px rgba(0,0,0,0.5)',
        }}
      >
        {/* neon sign */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '14px 36px',
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 'clamp(40px, 7vw, 84px)',
            letterSpacing: '0.08em',
            color: '#ffe1c8',
            textShadow:
              '0 0 6px #ff8a3a, 0 0 18px #ff6a18, 0 0 38px #ff4a08, 0 0 70px rgba(255,106,24,0.6)',
            border: `2px solid ${ORANGE}`,
            boxShadow:
              `0 0 10px ${ORANGE}, 0 0 30px ${ORANGE}88, inset 0 0 14px ${ORANGE}66`,
            background: 'rgba(20,8,4,0.6)',
            whiteSpace: 'nowrap',
          }}
        >
          FLYNN&apos;S
        </div>

        {/* the door */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Enter Flynn's"
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(170px, 36vw)',
            height: 'min(280px, 44vh)',
            background:
              'linear-gradient(180deg, #1a0a05 0%, #2a1408 60%, #100704 100%)',
            border: `2px solid ${ORANGE_DIM}`,
            borderBottom: 'none',
            cursor: 'pointer',
            boxShadow: `inset 0 0 18px ${ORANGE}33, 0 0 24px ${ORANGE}55`,
            padding: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: 14,
          }}
        >
          <span
            style={{
              fontSize: 9,
              letterSpacing: '0.4em',
              color: ORANGE,
              textTransform: 'uppercase',
              textShadow: `0 0 8px ${ORANGE}`,
            }}
          >
            Enter
          </span>
          {/* door handle */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              right: 12,
              top: '52%',
              width: 6,
              height: 6,
              background: '#ffd2a8',
              borderRadius: '50%',
              boxShadow: `0 0 6px ${ORANGE}`,
            }}
          />
        </button>
      </div>

      {/* footer status line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 10,
          textAlign: 'center',
          fontSize: 10,
          letterSpacing: '0.36em',
          color: ORANGE_DIM,
          textTransform: 'uppercase',
        }}
      >
        Flynn&apos;s Arcade &middot; Est. 1982 &middot; Closed To The Public
      </div>

      <PasswordModal
        gate="flynns"
        title="Flynn's Arcade"
        hint="The door is locked. Bouncer wants a name."
        accent={ORANGE}
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </main>
  );
}
