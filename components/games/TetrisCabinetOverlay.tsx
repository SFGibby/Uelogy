'use client';

// Full-screen overlay launched by the TETRIS cabinet on Sam's home.
// Stage 1: PRESS START screen (no audio, no game).
// Stage 2: clicking START in one user-gesture both starts BlockDrop and unmutes audio.

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useMute } from '../site/MuteToggle';

const BlockDrop = dynamic(() => import('../BlockDrop'), { ssr: false });

interface Props {
  onClose: () => void;
}

const GREEN = '#33ff33';
const GREEN_DIM = '#1aaa1a';
const FONT = 'var(--font-vt323), monospace';

export default function TetrisCabinetOverlay({ onClose }: Props) {
  const [started, setStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted] = useMute();

  useEffect(() => {
    const audio = new Audio('/tetris.mp3');
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (muted) {
      a.pause();
    } else if (started) {
      void a.play().catch(() => {});
    }
  }, [muted, started]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleStart() {
    setStarted(true);
    if (!muted) void audioRef.current?.play().catch(() => {});
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tetris"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close Tetris"
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 210,
          minWidth: 44,
          minHeight: 44,
          background: 'rgba(0,0,0,0.7)',
          border: `1px solid ${GREEN}`,
          color: GREEN,
          fontFamily: FONT,
          fontSize: 16,
          cursor: 'pointer',
          padding: '4px 14px',
        }}
      >
        ✕ EXIT
      </button>

      {!started ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            color: GREEN,
            fontFamily: FONT,
            textShadow: `0 0 8px ${GREEN}`,
          }}
        >
          <div style={{ fontSize: 38, letterSpacing: '0.16em' }}>TETRIS</div>
          <div style={{ fontSize: 14, color: GREEN_DIM, textShadow: 'none' }}>
            INSERT QUARTER (FREE PLAY)
          </div>
          <button
            onClick={handleStart}
            autoFocus
            style={{
              marginTop: 14,
              background: 'transparent',
              border: `1px solid ${GREEN}`,
              color: GREEN,
              padding: '14px 32px',
              fontFamily: FONT,
              fontSize: 22,
              letterSpacing: '0.2em',
              cursor: 'pointer',
              minHeight: 48,
              minWidth: 200,
              boxShadow: `0 0 12px ${GREEN}66`,
            }}
          >
            ▶ PRESS START
          </button>
          <div style={{ color: GREEN_DIM, fontSize: 13, marginTop: 12 }}>
            ARROWS · ROTATE · SPACE · ESC TO EXIT
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 640 }}>
          <BlockDrop audioRef={audioRef} />
        </div>
      )}
    </div>
  );
}
