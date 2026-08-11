'use client';

// Client-site ticker scrolling + a "$" score counter climbing. Cabinet: HUSTLE.

import { useEffect, useRef, useState } from 'react';

const CLIENTS = [
  'RIDE-SO-UTAH',
  'RT-MGMT',
  'SUNPOWER',
  'UELOGY',
  'WELCOME-HOME',
  'ATLAS',
];

export default function HustleTickerDemo() {
  const [score, setScore] = useState(12420);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    let id: number | undefined;
    let running = true;
    const tick = () => {
      if (!running) return;
      setScore((s) => s + Math.floor(3 + Math.random() * 12));
      id = window.setTimeout(tick, 220);
    };
    id = window.setTimeout(tick, 220);
    const onVis = () => {
      running = !document.hidden;
      if (running) id = window.setTimeout(tick, 200);
      else if (id) window.clearTimeout(id);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      running = false;
      if (id) window.clearTimeout(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const scrollText = [...CLIENTS, ...CLIENTS].join(' • ');

  return (
    <div
      ref={wrapRef}
      aria-hidden
      style={{
        width: '100%',
        height: '100%',
        background: '#0b0a06',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        fontFamily: 'var(--font-vt323), ui-monospace, monospace',
        color: '#ffd700',
      }}
    >
      <div
        style={{
          padding: '10px 12px 6px',
          textAlign: 'right',
          fontSize: 22,
          letterSpacing: '0.04em',
          textShadow: '0 0 6px #ffd70088',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        ${score.toLocaleString()}
      </div>
      <div
        style={{
          fontSize: 10,
          color: '#f0c060',
          opacity: 0.8,
          textAlign: 'left',
          padding: '0 12px',
          letterSpacing: '0.15em',
        }}
      >
        CLIENTS
      </div>
      <div
        style={{
          padding: '6px 0 12px',
          borderTop: '1px solid #4a3810',
          background: '#161006',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            paddingLeft: '100%',
            fontSize: 11,
            letterSpacing: '0.2em',
            color: '#f0c060',
            animation: 'hustle-scroll 16s linear infinite',
            animationPlayState: 'running',
          }}
        >
          {scrollText}
        </div>
      </div>
      <style>{`
        @keyframes hustle-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
