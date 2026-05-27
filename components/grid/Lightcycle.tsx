'use client';

// Lightcycle — Tron-style canvas game intro for /grid. Player (cyan) vs AI
// (orange). Don't crash into a wall, your own trail, or the opponent's
// trail. Last one standing wins. Reuses the BlockDrop pattern of a static
// stateRef + RAF loop with millisecond-throttled ticks.

import { useEffect, useRef, useState, useCallback } from 'react';

const COLS = 56;
const ROWS = 30;
const CELL = 14;
const TICK_MS = 70;

type Dir = 'up' | 'down' | 'left' | 'right';

interface CycleState {
  x: number;
  y: number;
  dir: Dir;
  trail: Set<string>;
  alive: boolean;
}

interface Props {
  onEnd: (result: 'win' | 'lose') => void;
  onSkip: () => void;
}

function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

function newCycle(x: number, y: number, dir: Dir): CycleState {
  return { x, y, dir, trail: new Set([cellKey(x, y)]), alive: true };
}

function moveOnce(c: { x: number; y: number; dir: Dir }): { x: number; y: number } {
  let { x, y } = c;
  if (c.dir === 'up') y--;
  else if (c.dir === 'down') y++;
  else if (c.dir === 'left') x--;
  else if (c.dir === 'right') x++;
  return { x, y };
}

function isHit(x: number, y: number, walls: Set<string>): boolean {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
  return walls.has(cellKey(x, y));
}

// AI heuristic: try to continue, else turn whichever side has more open space.
function aiChooseDir(c: CycleState, walls: Set<string>): Dir {
  const tryDir = (d: Dir): boolean => {
    const next = moveOnce({ x: c.x, y: c.y, dir: d });
    return !isHit(next.x, next.y, walls);
  };
  const measureDir = (d: Dir): number => {
    // BFS from the next cell to estimate open-space depth.
    const next = moveOnce({ x: c.x, y: c.y, dir: d });
    if (isHit(next.x, next.y, walls)) return -1;
    const visited = new Set<string>([cellKey(next.x, next.y)]);
    const queue: { x: number; y: number }[] = [{ x: next.x, y: next.y }];
    let head = 0;
    let depth = 0;
    while (head < queue.length && depth < 60) {
      const cell = queue[head++];
      for (const [dx, dy] of [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ]) {
        const nx = cell.x + dx;
        const ny = cell.y + dy;
        const k = cellKey(nx, ny);
        if (visited.has(k)) continue;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
        if (walls.has(k)) continue;
        visited.add(k);
        queue.push({ x: nx, y: ny });
        depth++;
      }
    }
    return visited.size;
  };
  const turns: Record<Dir, [Dir, Dir]> = {
    up: ['left', 'right'],
    down: ['right', 'left'],
    left: ['down', 'up'],
    right: ['up', 'down'],
  };
  const [t1, t2] = turns[c.dir];
  const candidates: { d: Dir; score: number }[] = [
    { d: c.dir, score: tryDir(c.dir) ? measureDir(c.dir) : -1 },
    { d: t1, score: tryDir(t1) ? measureDir(t1) : -1 },
    { d: t2, score: tryDir(t2) ? measureDir(t2) : -1 },
  ];
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].score >= 0 ? candidates[0].d : c.dir;
}

export default function Lightcycle({ onEnd, onSkip }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ player: CycleState; ai: CycleState }>({
    player: newCycle(6, Math.floor(ROWS / 2), 'right'),
    ai: newCycle(COLS - 7, Math.floor(ROWS / 2), 'left'),
  });
  const [finished, setFinished] = useState<'win' | 'lose' | null>(null);
  const finishedRef = useRef(finished);
  useEffect(() => {
    finishedRef.current = finished;
  }, [finished]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Faint grid
    ctx.strokeStyle = 'rgba(0,240,255,0.07)';
    ctx.lineWidth = 1;
    for (let i = 1; i < COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL + 0.5, 0);
      ctx.lineTo(i * CELL + 0.5, ROWS * CELL);
      ctx.stroke();
    }
    for (let i = 1; i < ROWS; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * CELL + 0.5);
      ctx.lineTo(COLS * CELL, i * CELL + 0.5);
      ctx.stroke();
    }

    // Trails
    const { player, ai } = stateRef.current;
    ctx.fillStyle = '#00b8d4';
    player.trail.forEach((k) => {
      const [x, y] = k.split(',').map(Number);
      ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
    });
    ctx.fillStyle = '#cc7a00';
    ai.trail.forEach((k) => {
      const [x, y] = k.split(',').map(Number);
      ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
    });

    // Heads
    if (player.alive) {
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(player.x * CELL, player.y * CELL, CELL, CELL);
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.fillRect(player.x * CELL, player.y * CELL, CELL, CELL);
      ctx.shadowBlur = 0;
    }
    if (ai.alive) {
      ctx.fillStyle = '#f0a000';
      ctx.fillRect(ai.x * CELL, ai.y * CELL, CELL, CELL);
      ctx.shadowColor = '#f0a000';
      ctx.shadowBlur = 12;
      ctx.fillRect(ai.x * CELL, ai.y * CELL, CELL, CELL);
      ctx.shadowBlur = 0;
    }
  }, []);

  // Player input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (finishedRef.current) return;
      const map: Record<string, Dir> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        W: 'up',
        s: 'down',
        S: 'down',
        a: 'left',
        A: 'left',
        d: 'right',
        D: 'right',
      };
      const dir = map[e.key];
      if (!dir) return;
      const opposite: Record<Dir, Dir> = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left',
      };
      const p = stateRef.current.player;
      if (dir === opposite[p.dir]) return;
      e.preventDefault();
      p.dir = dir;
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Game loop
  useEffect(() => {
    let raf = 0;
    let lastTick = 0;
    draw(); // initial paint
    const loop = (t: number) => {
      if (finishedRef.current) {
        draw();
        raf = requestAnimationFrame(loop);
        return;
      }
      if (t - lastTick >= TICK_MS) {
        lastTick = t;
        const { player, ai } = stateRef.current;

        // Compose current walls for AI decision
        const walls = new Set<string>();
        player.trail.forEach((k) => walls.add(k));
        ai.trail.forEach((k) => walls.add(k));

        // AI chooses + moves
        if (ai.alive) {
          ai.dir = aiChooseDir(ai, walls);
          const next = moveOnce(ai);
          if (isHit(next.x, next.y, walls)) {
            ai.alive = false;
          } else {
            ai.x = next.x;
            ai.y = next.y;
            ai.trail.add(cellKey(ai.x, ai.y));
            walls.add(cellKey(ai.x, ai.y));
          }
        }

        // Player moves (uses freshly updated walls)
        if (player.alive) {
          const next = moveOnce(player);
          if (isHit(next.x, next.y, walls)) {
            player.alive = false;
          } else {
            player.x = next.x;
            player.y = next.y;
            player.trail.add(cellKey(player.x, player.y));
          }
        }

        // Resolve outcome
        if (!player.alive && !ai.alive) {
          setFinished('lose');
          window.setTimeout(() => onEnd('lose'), 1400);
        } else if (!player.alive) {
          setFinished('lose');
          window.setTimeout(() => onEnd('lose'), 1400);
        } else if (!ai.alive) {
          setFinished('win');
          window.setTimeout(() => onEnd('win'), 1400);
        }
        draw();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw, onEnd]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
      }}
    >
      <div
        style={{
          color: '#00f0ff',
          fontSize: 28,
          letterSpacing: '0.2em',
          fontWeight: 800,
          textShadow: '0 0 14px rgba(0,240,255,0.5)',
        }}
      >
        SURVIVE.
      </div>
      <div
        style={{
          color: 'rgba(0,240,255,0.55)',
          fontSize: 11,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}
      >
        Arrows or WASD &middot; Don&apos;t crash &middot; Outlast the orange one
      </div>
      <canvas
        ref={canvasRef}
        width={COLS * CELL}
        height={ROWS * CELL}
        style={{
          border: '1px solid rgba(0,240,255,0.45)',
          boxShadow: '0 0 28px rgba(0,240,255,0.28)',
          maxWidth: '90vw',
          height: 'auto',
        }}
      />
      <div style={{ minHeight: 32, display: 'flex', alignItems: 'center', gap: 18 }}>
        {finished === 'win' && (
          <div
            style={{
              color: '#00f0ff',
              fontSize: 18,
              letterSpacing: '0.22em',
              fontWeight: 800,
              textShadow: '0 0 14px rgba(0,240,255,0.6)',
            }}
          >
            DEREZZED. WELCOME TO THE GRID.
          </div>
        )}
        {finished === 'lose' && (
          <div
            style={{
              color: '#f0a000',
              fontSize: 18,
              letterSpacing: '0.22em',
              fontWeight: 800,
              textShadow: '0 0 14px rgba(240,160,0,0.6)',
            }}
          >
            END OF LINE.
          </div>
        )}
        {!finished && (
          <button
            onClick={onSkip}
            style={{
              background: 'transparent',
              border: '1px solid rgba(0,240,255,0.3)',
              color: 'rgba(0,240,255,0.6)',
              padding: '7px 16px',
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 700,
            }}
          >
            Skip &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
