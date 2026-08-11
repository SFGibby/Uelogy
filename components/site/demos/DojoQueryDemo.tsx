'use client';

// Chalkboard, a short SELECT query types itself, cursor blinks. Cabinet: DOJO (Learning).

import { useEffect, useRef, useState } from 'react';

const QUERIES = [
  'SELECT wisdom FROM notes;',
  'SELECT * FROM lessons WHERE stuck = true;',
  "UPDATE brain SET curious = 'always';",
  'SELECT next FROM knowledge_graph;',
];

export default function DojoQueryDemo() {
  const [text, setText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setText(QUERIES[0]);
      return;
    }

    let queryIdx = 0;
    let charIdx = 0;
    let phase: 'typing' | 'hold' | 'clearing' = 'typing';
    let running = true;
    let tickId: number | undefined;

    const tick = () => {
      if (!running) return;
      const q = QUERIES[queryIdx];
      const speedRaw = getComputedStyle(wrapRef.current ?? document.body).getPropertyValue('--ac-demo-speed');
      const speed = Math.max(0.5, parseFloat(speedRaw) || 1);
      let delay = 90 / speed;

      if (phase === 'typing') {
        charIdx++;
        setText(q.slice(0, charIdx));
        if (charIdx >= q.length) {
          phase = 'hold';
          delay = 2200 / speed;
        }
      } else if (phase === 'hold') {
        phase = 'clearing';
        delay = 60 / speed;
      } else {
        charIdx--;
        setText(q.slice(0, Math.max(0, charIdx)));
        if (charIdx <= 0) {
          queryIdx = (queryIdx + 1) % QUERIES.length;
          phase = 'typing';
          delay = 700 / speed;
        }
      }
      tickId = window.setTimeout(tick, delay);
    };
    tickId = window.setTimeout(tick, 500);

    const blinkId = window.setInterval(() => setShowCursor((s) => !s), 500);

    const onVis = () => {
      running = !document.hidden;
      if (running) tickId = window.setTimeout(tick, 200);
      else if (tickId) window.clearTimeout(tickId);
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      if (tickId) window.clearTimeout(tickId);
      window.clearInterval(blinkId);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      style={{
        width: '100%',
        height: '100%',
        background:
          'radial-gradient(ellipse at center, #2b3a2b 0%, #1c281c 70%, #131a13 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '0 12px',
        fontFamily: 'var(--font-vt323), ui-monospace, monospace',
        fontSize: 15,
        color: '#f0e6c8',
        letterSpacing: '0.02em',
        textShadow: '0 0 2px rgba(240,230,200,0.5)',
        overflow: 'hidden',
      }}
    >
      <span>
        <span style={{ color: '#a8c0a0' }}>&gt;&nbsp;</span>
        {text}
        <span style={{ opacity: showCursor ? 1 : 0 }}>▍</span>
      </span>
    </div>
  );
}
