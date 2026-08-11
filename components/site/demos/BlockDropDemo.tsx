'use client';

// Attract-mode demo for the BLOCKDROP cabinet. Pieces fall, occasionally clear a line, loops.
// Reads --ac-demo-speed off the parent cabinet for hover speed-up.
// Pauses on tab hidden. Freezes on a good static frame under prefers-reduced-motion.

import { useEffect, useRef } from 'react';

const COLS = 10;
const ROWS = 16;
const ACCENT = '#33ff33';

type Tetromino = number[][]; // 1 = filled

const PIECES: Tetromino[] = [
  // I
  [[1, 1, 1, 1]],
  // O
  [
    [1, 1],
    [1, 1],
  ],
  // T
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  // L
  [
    [1, 0],
    [1, 0],
    [1, 1],
  ],
  // S
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function BlockDropDemo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size the canvas to its container's pixel dimensions
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

    const grid: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    // Pre-seed a partial floor to sell the attract vibe
    const seedRow = ROWS - 1;
    for (let x = 0; x < COLS; x++) if (Math.random() > 0.35) grid[seedRow][x] = 1;
    for (let x = 0; x < COLS; x++) if (x !== 4 && Math.random() > 0.6) grid[seedRow - 1][x] = 1;

    let piece: Tetromino = rand(PIECES);
    let px = Math.floor(COLS / 2 - piece[0].length / 2);
    let py = 0;

    const dropOne = () => {
      const nextY = py + 1;
      // Collision?
      let collide = false;
      for (let y = 0; y < piece.length; y++) {
        for (let x = 0; x < piece[y].length; x++) {
          if (!piece[y][x]) continue;
          const gx = px + x;
          const gy = nextY + y;
          if (gy >= ROWS || (gy >= 0 && grid[gy][gx])) collide = true;
        }
      }
      if (collide) {
        // Lock in
        for (let y = 0; y < piece.length; y++) {
          for (let x = 0; x < piece[y].length; x++) {
            if (!piece[y][x]) continue;
            const gy = py + y;
            const gx = px + x;
            if (gy >= 0 && gy < ROWS) grid[gy][gx] = 1;
          }
        }
        // Clear full lines
        for (let y = ROWS - 1; y >= 0; y--) {
          if (grid[y].every((c) => c === 1)) {
            grid.splice(y, 1);
            grid.unshift(Array(COLS).fill(0));
            y++;
          }
        }
        // Reset every so often so the well doesn't fully fill in the attract loop
        const filled = grid.reduce((sum, row) => sum + row.reduce((s, c) => s + c, 0), 0);
        if (filled > COLS * ROWS * 0.55) {
          for (let y = 0; y < ROWS; y++) grid[y].fill(0);
          // Re-seed bottom
          for (let x = 0; x < COLS; x++) if (Math.random() > 0.4) grid[ROWS - 1][x] = 1;
        }
        piece = rand(PIECES);
        px = Math.floor(COLS / 2 - piece[0].length / 2);
        py = 0;
      } else {
        py = nextY;
      }
    };

    const draw = () => {
      const r = canvas.getBoundingClientRect();
      const w = r.width;
      const h = r.height;
      ctx.clearRect(0, 0, w, h);

      const cell = Math.min(w / COLS, h / ROWS);
      const offsetX = (w - cell * COLS) / 2;
      const offsetY = (h - cell * ROWS) / 2;

      // Faint grid
      ctx.strokeStyle = 'rgba(51,255,51,0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + x * cell, offsetY);
        ctx.lineTo(offsetX + x * cell, offsetY + ROWS * cell);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + y * cell);
        ctx.lineTo(offsetX + COLS * cell, offsetY + y * cell);
        ctx.stroke();
      }

      // Locked blocks
      ctx.fillStyle = ACCENT;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (!grid[y][x]) continue;
          ctx.fillRect(offsetX + x * cell + 1, offsetY + y * cell + 1, cell - 2, cell - 2);
        }
      }

      // Active piece (a little brighter to distinguish)
      ctx.fillStyle = '#7fff7f';
      for (let y = 0; y < piece.length; y++) {
        for (let x = 0; x < piece[y].length; x++) {
          if (!piece[y][x]) continue;
          const gx = px + x;
          const gy = py + y;
          if (gy < 0) continue;
          ctx.fillRect(offsetX + gx * cell + 1, offsetY + gy * cell + 1, cell - 2, cell - 2);
        }
      }
    };

    // Reduced-motion: draw once, static frame.
    if (reduced) {
      draw();
      return () => ro.disconnect();
    }

    let lastDrop = performance.now();
    let raf = 0;
    let running = true;

    const loop = (now: number) => {
      if (!running) return;
      // Read speed multiplier from the parent cabinet's CSS var. Default 1.
      const speedRaw = getComputedStyle(canvas.parentElement ?? canvas).getPropertyValue('--ac-demo-speed');
      const speed = Math.max(0.5, parseFloat(speedRaw) || 1);
      const interval = 400 / speed; // ms between drops at 1x
      if (now - lastDrop > interval) {
        dropOne();
        lastDrop = now;
      }
      draw();
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);

    const onVis = () => {
      running = !document.hidden;
      if (running) {
        lastDrop = performance.now();
        raf = window.requestAnimationFrame(loop);
      } else if (raf) {
        cancelAnimationFrame(raf);
      }
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
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
