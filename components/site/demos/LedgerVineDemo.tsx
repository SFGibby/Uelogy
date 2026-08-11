'use client';

// Vine growing across parchment. Cabinet: LEDGER.

import { useEffect, useRef } from 'react';

export default function LedgerVineDemo() {
  const pathRef = useRef<SVGPathElement | null>(null);
  const leavesRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    const path = pathRef.current;
    const leaves = leavesRef.current;
    if (!path || !leaves) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = reduced ? '0' : `${len}`;

    const leafEls = Array.from(leaves.children) as SVGElement[];
    leafEls.forEach((l) => (l.style.opacity = reduced ? '1' : '0'));

    if (reduced) return;

    let start = performance.now();
    let raf = 0;
    let running = true;

    const DURATION = 6000;

    const loop = (now: number) => {
      if (!running) return;
      const speedRaw = getComputedStyle(path.parentElement?.parentElement ?? path).getPropertyValue('--ac-demo-speed');
      const speed = Math.max(0.5, parseFloat(speedRaw) || 1);
      const t = ((now - start) * speed) / DURATION;
      const cycle = t % 2; // 0..2, first half draw, second half hold+fade
      if (cycle < 1) {
        const p = cycle;
        path.style.strokeDashoffset = `${len * (1 - p)}`;
        leafEls.forEach((l, i) => {
          const trigger = (i + 1) / (leafEls.length + 1);
          l.style.opacity = p > trigger ? '1' : '0';
        });
      } else if (cycle < 1.6) {
        // hold
      } else {
        // fade + reset
        const fadeT = (cycle - 1.6) / 0.4;
        const o = 1 - fadeT;
        path.style.opacity = `${Math.max(0, o)}`;
        leafEls.forEach((l) => (l.style.opacity = `${Math.max(0, o)}`));
      }
      if (cycle >= 2) {
        start = now;
        path.style.opacity = '1';
      }
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);

    const onVis = () => {
      running = !document.hidden;
      if (running) {
        start = performance.now();
        raf = window.requestAnimationFrame(loop);
      } else if (raf) cancelAnimationFrame(raf);
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <svg
      viewBox="0 0 200 150"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        background:
          'radial-gradient(ellipse at center, #f3e3b8 0%, #d9c088 70%, #a88b52 100%)',
      }}
    >
      <path
        ref={pathRef}
        d="M 10 130 C 30 120, 30 90, 60 85 S 90 60, 110 55 S 150 40, 180 25"
        fill="none"
        stroke="#3b5a2a"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <g ref={leavesRef}>
        <ellipse cx="40" cy="100" rx="6" ry="3" fill="#4d7a35" transform="rotate(-20 40 100)" />
        <ellipse cx="70" cy="78" rx="6" ry="3" fill="#4d7a35" transform="rotate(15 70 78)" />
        <ellipse cx="100" cy="60" rx="6" ry="3" fill="#4d7a35" transform="rotate(-25 100 60)" />
        <ellipse cx="135" cy="42" rx="6" ry="3" fill="#4d7a35" transform="rotate(20 135 42)" />
        <ellipse cx="165" cy="30" rx="6" ry="3" fill="#4d7a35" transform="rotate(-15 165 30)" />
      </g>
      {/* Brass corner ornament */}
      <path d="M 4 4 L 20 4 M 4 4 L 4 20" stroke="#b48a3a" strokeWidth="1" fill="none" />
      <path d="M 196 4 L 180 4 M 196 4 L 196 20" stroke="#b48a3a" strokeWidth="1" fill="none" />
      <path d="M 4 146 L 20 146 M 4 146 L 4 130" stroke="#b48a3a" strokeWidth="1" fill="none" />
      <path d="M 196 146 L 180 146 M 196 146 L 196 130" stroke="#b48a3a" strokeWidth="1" fill="none" />
    </svg>
  );
}
