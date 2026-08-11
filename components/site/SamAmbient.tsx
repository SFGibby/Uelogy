'use client';

// Ambient Sam: state machine. Idle → walk → sometimes approach + play a cabinet → repeat.
// Reads element positions off DOM nodes marked `data-arcade-cabinet`. When PLAYing at
// a cabinet, sets --ac-demo-speed: 2 on that element (its demo respects the var).
//
// Structured to consume a sprite sheet with named animations (idle / walk-left / walk-right / play).
// For now, no walk frames exist — motion is a subtle lean. Swap `renderFrame` when the sheet lands.

import { useEffect, useMemo, useRef, useState } from 'react';
import SamSprite from '../SamSprite';

type State = 'idle' | 'walk' | 'approach' | 'play';
type Facing = 'left' | 'right';

const WALK_PX_PER_SEC = 90;
const IDLE_MIN_MS = 5000;
const IDLE_MAX_MS = 15000;
const PLAY_MIN_MS = 8000;
const PLAY_MAX_MS = 12000;
const APPROACH_PROBABILITY = 0.4;
const SPRITE_WIDTH = 40; // matches SamSprite's 10 cols × 4px
const SPRITE_HEIGHT = 60;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// Ease sprite lean over its 4-frame walk cycle (future art) or a bob-and-lean for the static frame.
function leanForPhase(phase: number, facing: Facing) {
  // phase 0..1 across ~500ms cycle
  const bob = Math.sin(phase * Math.PI * 2) * 1.5;
  const tilt = Math.sin(phase * Math.PI * 2) * (facing === 'right' ? 3 : -3);
  return { bobY: bob, tiltDeg: tilt };
}

export default function SamAmbient() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [reduced, setReduced] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [facing, setFacing] = useState<Facing>('right');
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let running = true;
    let state: State = 'idle';
    let stateEndsAt = performance.now() + rand(IDLE_MIN_MS, IDLE_MAX_MS);
    let targetX = 0;
    let currentPlayedEl: HTMLElement | null = null;
    let last = performance.now();
    // Track x in local var so we can mutate without React re-renders per frame.
    let x = 0;
    let walkPhase = 0;

    // Position on init: place sprite at center-bottom of the viewport.
    const init = () => {
      x = window.innerWidth / 2 - SPRITE_WIDTH / 2;
      setPos({ x, y: window.innerHeight - SPRITE_HEIGHT - 48 });
    };
    init();

    const getCabinets = () => {
      return Array.from(
        document.querySelectorAll<HTMLElement>('[data-arcade-cabinet]')
      );
    };

    const pickWalkTarget = () => {
      const margin = 40;
      const min = margin;
      const max = window.innerWidth - SPRITE_WIDTH - margin;
      return rand(min, max);
    };

    const pickApproachTarget = () => {
      const cabinets = getCabinets();
      if (!cabinets.length) return null;
      const target = cabinets[Math.floor(Math.random() * cabinets.length)];
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 - SPRITE_WIDTH / 2;
      return { target, centerX };
    };

    const enterIdle = () => {
      state = 'idle';
      stateEndsAt = performance.now() + rand(IDLE_MIN_MS, IDLE_MAX_MS);
    };
    const enterWalk = (tx: number) => {
      state = 'walk';
      targetX = tx;
      setFacing(tx > x ? 'right' : 'left');
    };
    const enterApproach = () => {
      const pick = pickApproachTarget();
      if (!pick) return enterWalk(pickWalkTarget());
      state = 'approach';
      targetX = pick.centerX;
      currentPlayedEl = pick.target;
      setFacing(pick.centerX > x ? 'right' : 'left');
    };
    const enterPlay = () => {
      state = 'play';
      stateEndsAt = performance.now() + rand(PLAY_MIN_MS, PLAY_MAX_MS);
      if (currentPlayedEl) {
        currentPlayedEl.style.setProperty('--ac-demo-speed', '2');
      }
    };
    const leavePlay = () => {
      if (currentPlayedEl) {
        currentPlayedEl.style.removeProperty('--ac-demo-speed');
        currentPlayedEl = null;
      }
    };

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min(100, now - last);
      last = now;

      if (state === 'idle') {
        if (now >= stateEndsAt) {
          if (Math.random() < APPROACH_PROBABILITY) enterApproach();
          else enterWalk(pickWalkTarget());
        }
      } else if (state === 'walk' || state === 'approach') {
        const step = (WALK_PX_PER_SEC * dt) / 1000;
        const dir = targetX > x ? 1 : -1;
        walkPhase = (walkPhase + dt / 500) % 1;
        x += dir * step;
        if ((dir === 1 && x >= targetX) || (dir === -1 && x <= targetX)) {
          x = targetX;
          walkPhase = 0;
          if (state === 'approach') enterPlay();
          else enterIdle();
        }
        setPos((p) => ({ ...p, x }));
        setPhase(walkPhase);
      } else if (state === 'play') {
        if (now >= stateEndsAt) {
          leavePlay();
          enterIdle();
        }
      }

      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);

    const onResize = () => {
      setPos((p) => ({ ...p, y: window.innerHeight - SPRITE_HEIGHT - 48 }));
    };
    const onVis = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
      } else {
        last = performance.now();
        raf = window.requestAnimationFrame(loop);
      }
    };
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      leavePlay();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reduced]);

  const lean = useMemo(() => leanForPhase(phase, facing), [phase, facing]);
  const scaleX = facing === 'left' ? -1 : 1;

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: SPRITE_WIDTH,
        height: SPRITE_HEIGHT,
        transform: `translate(${pos.x}px, ${pos.y + lean.bobY}px)`,
        pointerEvents: 'none',
        zIndex: 5,
        transition: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scaleX(${scaleX}) rotate(${lean.tiltDeg}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <SamSprite />
      </div>
    </div>
  );
}
