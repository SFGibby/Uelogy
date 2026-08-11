'use client';

// Chat bubbles appear in sequence, clear, repeat. Cabinet: OFFICE (Triage).

import { useEffect, useState } from 'react';

type Bubble = { side: 'l' | 'r'; text: string };

const SCRIPTS: Bubble[][] = [
  [
    { side: 'l', text: 'ticket #482' },
    { side: 'r', text: 'on it' },
    { side: 'l', text: 'P1' },
  ],
  [
    { side: 'r', text: 'triage inbox' },
    { side: 'l', text: '3 flagged' },
    { side: 'r', text: 'routing…' },
  ],
  [
    { side: 'l', text: 'status?' },
    { side: 'r', text: 'shipped' },
    { side: 'l', text: '+1' },
  ],
];

export default function OfficeChatDemo() {
  const [scriptIdx, setScriptIdx] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setStep(3);
      return;
    }
    let id: number | undefined;
    let running = true;
    const tick = () => {
      if (!running) return;
      setStep((s) => {
        const next = s + 1;
        if (next > 4) {
          setScriptIdx((i) => (i + 1) % SCRIPTS.length);
          return 0;
        }
        return next;
      });
      id = window.setTimeout(tick, 1100);
    };
    id = window.setTimeout(tick, 600);
    const onVis = () => {
      running = !document.hidden;
      if (running) id = window.setTimeout(tick, 400);
      else if (id) window.clearTimeout(id);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      running = false;
      if (id) window.clearTimeout(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const bubbles = SCRIPTS[scriptIdx];

  return (
    <div
      aria-hidden
      style={{
        width: '100%',
        height: '100%',
        background: '#0f1218',
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        justifyContent: 'flex-end',
        fontFamily: 'var(--font-vt323), ui-monospace, monospace',
        fontSize: 11,
        color: '#e0e6f0',
        overflow: 'hidden',
      }}
    >
      {bubbles.map((b, i) => {
        const visible = i < step;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: b.side === 'l' ? 'flex-start' : 'flex-end',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 200ms ease, transform 200ms ease',
            }}
          >
            <span
              style={{
                background: b.side === 'l' ? '#232a3a' : '#ffb02033',
                color: b.side === 'l' ? '#c8d0e0' : '#ffd680',
                padding: '2px 8px',
                borderRadius: 8,
                border: b.side === 'r' ? '1px solid #ffb02066' : '1px solid #333c50',
                maxWidth: '75%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {b.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
