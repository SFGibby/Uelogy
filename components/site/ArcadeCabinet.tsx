'use client';

// Real arcade cabinet primitive. Zones top-to-bottom:
// marquee (brightest) → CRT screen (attract cycle) → control deck → coin door.
// The whole cabinet is one click target. Hover speeds the demo but never moves anything.

import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type Score = { rank: number; initials: string; score: number };

export type AttractState = 'demo' | 'scores' | 'press-start';

export interface ArcadeCabinetProps {
  /** Marquee title (short). Displayed uppercase in press-start face. */
  marquee: string;
  /** Route this cabinet opens. If omitted, an onActivate handler must be. */
  href?: string;
  /** Click handler. Used when locked (opens password modal) or when there's no route. */
  onActivate?: () => void;
  /** Per-cabinet accent hex. Drives buttons, scanline tint, marquee tint. */
  accent: string;
  /** The State A visual (game demo). Should freeze on prefers-reduced-motion. */
  demo: ReactNode;
  /** Real leaderboard rows. If null/empty, fallback is used. */
  scores?: Score[];
  /** Static styled table for cabinets with no real data. */
  fallbackScores?: Score[];
  /** Locked cabinets: dimmed marquee + coin-door text says INSERT COIN, screen State C reads 1 CREDIT REQUIRED. */
  locked?: boolean;
  /** Per-cabinet attract-cycle offset in ms, so cabinets never sync. */
  startOffsetMs?: number;
  /** Per-state dwell in ms. Vary per cabinet so screens change on independent cadences. */
  stateDurationMs?: number;
  /** Accessible label if marquee alone isn't clear. */
  ariaLabel?: string;
}

const CYCLE: AttractState[] = ['demo', 'scores', 'press-start'];

const DEFAULT_FALLBACK: Score[] = [
  { rank: 1, initials: 'SAM', score: 999999 },
  { rank: 2, initials: 'UEL', score: 850000 },
  { rank: 3, initials: 'MTG', score: 720000 },
];

function pad(n: number, width: number) {
  return n.toString().padStart(width, '0');
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/**
 * Rotates through the CYCLE on a timer. Freezes when reduced-motion is on
 * (holds on 'demo' — the parent decides how demos render statically).
 */
function useAttractCycle(startOffsetMs: number, stateDurationMs: number, freeze: boolean) {
  const [state, setState] = useState<AttractState>('demo');
  useEffect(() => {
    if (freeze) return;
    const startIdx = Math.floor((startOffsetMs / stateDurationMs) % CYCLE.length);
    let idx = startIdx;
    setState(CYCLE[idx]);
    const id = window.setInterval(() => {
      idx = (idx + 1) % CYCLE.length;
      setState(CYCLE[idx]);
    }, stateDurationMs);
    return () => window.clearInterval(id);
  }, [startOffsetMs, stateDurationMs, freeze]);
  return state;
}

/**
 * Renders a top-3 leaderboard styled like an arcade high-scores screen.
 */
function ScoresPanel({ scores, accent }: { scores: Score[]; accent: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'var(--font-press-start), monospace',
        fontVariantNumeric: 'tabular-nums',
        color: accent,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: '0.28em',
          opacity: 0.85,
          textShadow: `0 0 4px ${accent}`,
        }}
      >
        HIGH SCORES
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto auto',
          columnGap: 14,
          rowGap: 4,
          fontSize: 10,
          lineHeight: 1.2,
        }}
      >
        {scores.slice(0, 3).map((s) => (
          <div key={s.rank} style={{ display: 'contents' }}>
            <span style={{ opacity: 0.7 }}>{pad(s.rank, 2)}</span>
            <span>{s.initials}</span>
            <span style={{ textAlign: 'right' }}>{pad(s.score, 7)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Blinking full-screen "PRESS START" (or "1 CREDIT REQUIRED" when locked).
 */
function PressStartPanel({ locked, accent }: { locked: boolean; accent: string }) {
  const label = locked ? '1 CREDIT REQUIRED' : 'PRESS START';
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-press-start), monospace',
        fontSize: 10,
        letterSpacing: '0.18em',
        color: accent,
        textShadow: `0 0 6px ${accent}`,
        animation: 'ac-blink 1s steps(2) infinite',
      }}
    >
      {label}
    </div>
  );
}

export default function ArcadeCabinet({
  marquee,
  href,
  onActivate,
  accent,
  demo,
  scores,
  fallbackScores,
  locked = false,
  startOffsetMs = 0,
  stateDurationMs = 7000,
  ariaLabel,
}: ArcadeCabinetProps) {
  const reduced = usePrefersReducedMotion();
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Pause the cycle when tab is hidden — demos also individually respect this via their own listeners.
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const cycleState = useAttractCycle(startOffsetMs, stateDurationMs, reduced || !visible);
  // Hover snaps to the "press-start / 1 credit required" screen — the invitation to play.
  const state: AttractState = hovering ? 'press-start' : cycleState;

  const handleClick = useCallback(() => {
    if (onActivate) onActivate();
    else if (href) window.location.href = href;
  }, [onActivate, href]);

  const activeScores =
    scores && scores.length ? scores : fallbackScores ?? DEFAULT_FALLBACK;

  const marqueeStyle: CSSProperties = {
    fontFamily: 'var(--font-press-start), monospace',
    fontSize: 15,
    letterSpacing: '0.14em',
    color: locked ? '#c7b78a' : '#fff5d6',
    // Marquees are the brightest thing on the page. Dimmer if locked.
    textShadow: locked
      ? `0 0 3px ${accent}66, 0 0 8px ${accent}44`
      : `0 0 4px ${accent}, 0 0 10px ${accent}dd, 0 0 24px ${accent}88, 0 0 48px ${accent}55`,
    transition: 'filter 200ms ease',
    filter: hovering ? 'brightness(1.15)' : 'brightness(1)',
    textAlign: 'center',
    padding: '10px 8px 12px',
    // Backlit strip
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.35))',
    borderBottom: `1px solid ${accent}44`,
  };

  const cabinetStyle: CSSProperties = {
    position: 'relative',
    width: 260,
    background: '#0a0a10',
    border: '1px solid #1c1c26',
    borderRadius: '18px 18px 6px 6px',
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.05),
      0 24px 40px -12px rgba(0,0,0,0.6),
      0 0 0 1px rgba(0,0,0,0.6)
    `,
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const screenWrapStyle: CSSProperties = {
    position: 'relative',
    margin: '10px 14px 0',
    aspectRatio: '4 / 3',
    background: '#000',
    borderRadius: 4,
    overflow: 'hidden',
    boxShadow: `
      inset 0 0 22px rgba(0,0,0,0.9),
      inset 0 0 60px rgba(0,0,0,0.6),
      0 0 0 1px ${accent}33
    `,
  };

  // Scanline overlay — texture, not decoration. Barely visible.
  const scanlineStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    backgroundImage:
      'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 1px, rgba(255,255,255,0.045) 2px, rgba(255,255,255,0.045) 2px)',
    mixBlendMode: 'overlay',
  };

  // Speed multiplier passed to demo via CSS var. Demo authors reference it if they care.
  const demoSpeed = hovering ? 1.5 : 1;

  const controlDeckStyle: CSSProperties = {
    margin: '10px 12px 0',
    padding: '10px 16px',
    background: '#12121a',
    borderTop: '1px solid #202030',
    borderRadius: 3,
    // Angled deck feel
    transform: 'perspective(200px) rotateX(6deg)',
    transformOrigin: 'top center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  };

  const coinDoorStyle: CSSProperties = {
    margin: '12px 14px 14px',
    padding: '8px 10px',
    background: '#0f0f18',
    border: '1px solid #1e1e2a',
    borderRadius: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: 'var(--font-vt323), monospace',
    fontSize: 12,
    letterSpacing: '0.14em',
    color: locked ? `${accent}cc` : '#5a5a6a',
    textShadow: locked ? `0 0 4px ${accent}88` : 'none',
  };

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel ?? marquee}
      data-arcade-cabinet={marquee}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      style={
        {
          ...cabinetStyle,
          ['--ac-demo-speed']: demoSpeed,
        } as CSSProperties
      }
    >
      {/* Marquee */}
      <div style={marqueeStyle}>{marquee}</div>

      {/* CRT screen */}
      <div style={screenWrapStyle}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            opacity: state === 'demo' ? 1 : 0,
            transition: 'opacity 300ms ease',
          }}
        >
          {demo}
        </div>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            opacity: state === 'scores' ? 1 : 0,
            transition: 'opacity 300ms ease',
          }}
        >
          <ScoresPanel scores={activeScores} accent={accent} />
        </div>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            opacity: state === 'press-start' ? 1 : 0,
            transition: 'opacity 300ms ease',
          }}
        >
          <PressStartPanel locked={locked} accent={accent} />
        </div>
        {/* Scanlines + vignette (order matters) */}
        <div aria-hidden style={scanlineStyle} />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.7)',
          }}
        />
      </div>

      {/* Control deck */}
      <div style={controlDeckStyle} aria-hidden>
        {/* Joystick */}
        <div
          style={{
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 6,
              height: 16,
              background: '#2a2a36',
              borderRadius: '3px 3px 1px 1px',
              boxShadow: '0 -6px 0 -2px #1a1a24, inset -1px 0 0 rgba(0,0,0,0.5)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#e11',
              transform: 'translateY(-8px)',
              boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.4), 0 0 4px rgba(0,0,0,0.6)',
            }}
          />
        </div>
        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: accent,
              boxShadow: `inset -2px -2px 0 rgba(0,0,0,0.35), 0 0 6px ${accent}88`,
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: accent,
              opacity: 0.7,
              boxShadow: `inset -2px -2px 0 rgba(0,0,0,0.35), 0 0 4px ${accent}66`,
            }}
          />
        </div>
      </div>

      {/* Coin door */}
      <div style={coinDoorStyle} aria-hidden>
        <span
          style={{
            display: 'inline-block',
            width: 22,
            height: 4,
            background: '#000',
            border: '1px solid #2a2a36',
            borderRadius: 1,
            boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.9)',
          }}
        />
        <span>{locked ? 'INSERT COIN · 25¢' : 'FREE PLAY'}</span>
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: locked ? accent : '#2a2a36',
            boxShadow: locked ? `0 0 6px ${accent}` : 'none',
          }}
        />
      </div>

      <style>{`
        @keyframes ac-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}
