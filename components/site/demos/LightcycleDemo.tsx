'use client';

// Two lightcycles drawing trails on a dark grid. Cabinet: GRID.

import { useEffect, useRef } from 'react';

const COLS = 24;
const ROWS = 18;
const A = '#00f0ff';
const B = '#ff8a3a';

type Bike = { x: number; y: number; dx: number; dy: number; color: string };

function randDir(): [number, number] {
  const opts: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  return opts[Math.floor(Math.random() * opts.length)];
}

export default function LightcycleDemo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let grid: string[][] = [];
    let bikes: Bike[] = [];
    let dead = 0;
    let clearHold = 0;

    const reset = () => {
      grid = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
      const [ax, ay] = randDir();
      const [bx, by] = randDir();
      bikes = [
        { x: 4, y: Math.floor(ROWS / 2), dx: ax, dy: ay, color: A },
        { x: COLS - 5, y: Math.floor(ROWS / 2), dx: bx, dy: by, color: B },
      ];
      dead = 0;
    };
    reset();

    const step = () => {
      if (clearHold > 0) {
        clearHold--;
        if (clearHold === 0) reset();
        return;
      }
      for (const b of bikes) {
        if (!b.color) continue;
        const nx = b.x + b.dx;
        const ny = b.y + b.dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || grid[ny][nx]) {
          // crash — try one 90° turn, else die
          const turns: [number, number][] = [[b.dy, -b.dx], [-b.dy, b.dx]];
          const turn = turns[Math.floor(Math.random() * 2)];
          const tx = b.x + turn[0];
          const ty = b.y + turn[1];
          if (tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS && !grid[ty][tx]) {
            b.dx = turn[0];
            b.dy = turn[1];
            b.x = tx;
            b.y = ty;
            grid[ty][tx] = b.color;
          } else {
            b.color = '';
            dead++;
          }
        } else {
          b.x = nx;
          b.y = ny;
          grid[ny][nx] = b.color;
          // random slight direction change ~5%
          if (Math.random() < 0.05) {
            const turns: [number, number][] = [[b.dy, -b.dx], [-b.dy, b.dx]];
            const t = turns[Math.floor(Math.random() * 2)];
            b.dx = t[0];
            b.dy = t[1];
          }
        }
      }
      if (dead >= 2) clearHold = 20;
    };

    const draw = () => {
      const r = canvas.getBoundingClientRect();
      const w = r.width;
      const h = r.height;
      ctx.clearRect(0, 0, w, h);
      const cell = Math.min(w / COLS, h / ROWS);
      const offX = (w - cell * COLS) / 2;
      const offY = (h - cell * ROWS) / 2;

      // grid lines
      ctx.strokeStyle = 'rgba(0,240,255,0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(offX + x * cell, offY);
        ctx.lineTo(offX + x * cell, offY + ROWS * cell);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(offX, offY + y * cell);
        ctx.lineTo(offX + COLS * cell, offY + y * cell);
        ctx.stroke();
      }

      // trails
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const c = grid[y][x];
          if (!c) continue;
          ctx.fillStyle = c;
          ctx.fillRect(offX + x * cell + 0.5, offY + y * cell + 0.5, cell - 1, cell - 1);
        }
      }
    };

    if (reduced) {
      // pre-run a short simulation for a static frame
      for (let i = 0; i < 40; i++) step();
      draw();
      return () => ro.disconnect();
    }

    let lastStep = performance.now();
    let raf = 0;
    let running = true;

    const loop = (now: number) => {
      if (!running) return;
      const speedRaw = getComputedStyle(canvas.parentElement ?? canvas).getPropertyValue('--ac-demo-speed');
      const speed = Math.max(0.5, parseFloat(speedRaw) || 1);
      const interval = 90 / speed;
      if (now - lastStep > interval) {
        step();
        lastStep = now;
      }
      draw();
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);

    const onVis = () => {
      running = !document.hidden;
      if (running) {
        lastStep = performance.now();
        raf = window.requestAnimationFrame(loop);
      } else if (raf) cancelAnimationFrame(raf);
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ width: '100%', height: '100%', display: 'block', background: '#040610' }}
    />
  );
}
