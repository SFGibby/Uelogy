'use client';

import { useEffect, useState } from 'react';

interface Props {
  duration?: number;
  onComplete: () => void;
}

export default function Digitize({ duration = 1600, onComplete }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const audio = new Audio('/sfx/digitize.mp3');
      audio.volume = 0.5;
      void audio.play().catch(() => {});
    } catch {}
    const t = window.setTimeout(onComplete, duration);
    return () => window.clearTimeout(t);
  }, [duration, onComplete]);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        pointerEvents: 'none',
        background: 'rgba(0,0,0,0)',
      }}
    >
      <style>{`
        @keyframes dz-scan {
          0%   { top: -8px;  opacity: 0.0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100vh; opacity: 0.0; }
        }
        @keyframes dz-flash {
          0%, 70% { background: rgba(0,0,0,0); }
          100%    { background: rgba(0,240,255,0.18); }
        }
        @keyframes dz-grid {
          0%   { opacity: 0; }
          40%  { opacity: 0.35; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* whole-screen cyan wash at the end */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          animation: mounted ? `dz-flash ${duration}ms linear forwards` : undefined,
        }}
      />

      {/* faint Tron grid overlay that bleeds in */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0,240,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          mixBlendMode: 'screen',
          animation: mounted ? `dz-grid ${duration}ms ease-in-out forwards` : undefined,
        }}
      />

      {/* the scan bar itself */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 6,
          background: '#ffffff',
          boxShadow: '0 0 18px 4px rgba(0,240,255,0.9), 0 0 36px 8px rgba(0,240,255,0.4)',
          animation: mounted ? `dz-scan ${duration}ms ease-in forwards` : undefined,
        }}
      />
    </div>
  );
}
