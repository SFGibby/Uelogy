'use client';

// Floor plane with a 90s arcade carpet tile pattern. Low-contrast squiggles + confetti
// on near-black. Perspective-tilted so it reads as receding floor.

import { useMemo } from 'react';

function buildTileSvg() {
  // Small tile with a few neon strokes + confetti dots at low alpha.
  // Keep contrast LOW — this is texture, not decoration.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <rect width="120" height="120" fill="#080a12"/>
    <path d="M 8 40 Q 30 20, 55 42 T 108 30" stroke="rgba(0,240,255,0.09)" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M 12 78 Q 35 96, 62 78 T 112 88" stroke="rgba(255,64,180,0.09)" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M 4 110 L 28 96 L 52 108 L 76 92 L 100 106 L 120 96" stroke="rgba(255,215,0,0.08)" stroke-width="1" fill="none"/>
    <circle cx="24" cy="20" r="1.6" fill="rgba(255,64,180,0.18)"/>
    <circle cx="88" cy="16" r="1.4" fill="rgba(0,240,255,0.16)"/>
    <circle cx="46" cy="60" r="1.6" fill="rgba(255,215,0,0.14)"/>
    <circle cx="98" cy="72" r="1.4" fill="rgba(0,240,255,0.14)"/>
    <circle cx="18" cy="98" r="1.6" fill="rgba(255,64,180,0.16)"/>
    <circle cx="72" cy="112" r="1.4" fill="rgba(255,215,0,0.14)"/>
    <rect x="60" y="34" width="4" height="4" transform="rotate(45 62 36)" fill="rgba(180,120,255,0.13)"/>
    <rect x="30" y="70" width="4" height="4" transform="rotate(45 32 72)" fill="rgba(120,255,180,0.11)"/>
    <rect x="100" y="52" width="4" height="4" transform="rotate(45 102 54)" fill="rgba(255,180,120,0.11)"/>
  </svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export default function ArcadeCarpet() {
  const url = useMemo(buildTileSvg, []);
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: '68vh',
        backgroundImage: url,
        backgroundRepeat: 'repeat',
        backgroundSize: '120px 120px',
        transform: 'perspective(700px) rotateX(58deg)',
        transformOrigin: 'bottom center',
        WebkitMaskImage:
          'linear-gradient(180deg, transparent 0%, transparent 8%, rgba(0,0,0,0.75) 45%, #000 100%)',
        maskImage:
          'linear-gradient(180deg, transparent 0%, transparent 8%, rgba(0,0,0,0.75) 45%, #000 100%)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
