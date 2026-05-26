'use client';

// Tron-style background: pure black + faint cyan grid masked with a radial
// vignette so the grid fades to black at the edges. Plus a glowing horizon
// strip at the bottom. No noise, no gradient — just clean geometry.

export default function GridBackground() {
  return (
    <>
      {/* Pure black backdrop */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: '#000', pointerEvents: 'none' }} />

      {/* 40px cyan grid masked with a radial fade — strongest in the middle */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          backgroundImage: [
            'linear-gradient(to right, rgba(0,240,255,0.10) 1px, transparent 1px)',
            'linear-gradient(to bottom, rgba(0,240,255,0.10) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '40px 40px',
          maskImage:
            'radial-gradient(ellipse 90% 75% at 50% 55%, #000 35%, transparent 85%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 90% 75% at 50% 55%, #000 35%, transparent 85%)',
          pointerEvents: 'none',
        }}
      />

      {/* Perspective floor — a brighter horizon strip near the bottom */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          background:
            'linear-gradient(to right, transparent 0%, rgba(0,240,255,0.6) 35%, rgba(0,240,255,0.85) 50%, rgba(0,240,255,0.6) 65%, transparent 100%)',
          boxShadow: '0 -2px 20px rgba(0,240,255,0.45)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Subtle scanline overlay for the CRT feel — every 3px, very faint */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0 1px, transparent 1px 3px)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
