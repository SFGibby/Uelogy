'use client';

// Single trading card flips front/back. Cabinet: COLLECTION.

import { useEffect, useState } from 'react';

export default function CardFlipDemo() {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    let id: number | undefined;
    let running = true;
    const tick = () => {
      if (!running) return;
      setFlipped((f) => !f);
      id = window.setTimeout(tick, 2400);
    };
    id = window.setTimeout(tick, 1500);
    const onVis = () => {
      running = !document.hidden;
      if (running) id = window.setTimeout(tick, 1000);
      else if (id) window.clearTimeout(id);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      running = false;
      if (id) window.clearTimeout(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#181022',
        perspective: 600,
      }}
    >
      <div
        style={{
          width: '55%',
          aspectRatio: '2 / 3',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 900ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Front */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            background:
              'linear-gradient(160deg, #d040a0 0%, #6a1a4a 100%)',
            border: '2px solid #f0a0d0',
            borderRadius: 6,
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-press-start), monospace',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 5, letterSpacing: '0.2em' }}>COLLECTION</div>
          <div
            style={{
              width: '70%',
              aspectRatio: '1',
              borderRadius: 3,
              background:
                'repeating-linear-gradient(45deg, #ffd0e8 0 4px, #f0a0d0 4px 8px)',
              boxShadow: 'inset 0 0 6px rgba(0,0,0,0.4)',
            }}
          />
          <div style={{ fontSize: 4, letterSpacing: '0.15em', opacity: 0.85 }}>★ RARE</div>
        </div>
        {/* Back */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background:
              'linear-gradient(160deg, #2a1030 0%, #100818 100%)',
            border: '2px solid #6a3a80',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-press-start), monospace',
            color: '#d040a0',
            fontSize: 8,
            letterSpacing: '0.2em',
            textShadow: '0 0 6px #d040a0',
          }}
        >
          UEL
        </div>
      </div>
    </div>
  );
}
