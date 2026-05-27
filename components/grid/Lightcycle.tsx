'use client';

// Lightcycle — Tron-style canvas game for /grid. Level-based:
//   • Each level: cycle vs AI, same arena, faster tick + smarter AI per level.
//   • Win the round: level cleared, choose Next or End.
//   • Lose the round: game over, prompt name, save to leaderboard.
// Leaderboard lives in localStorage under 'lightcycle_leaderboard'.

import { useEffect, useRef, useState, useCallback } from 'react';

const COLS = 56;
const ROWS = 30;
const CELL = 14;
const LEADERBOARD_KEY = 'lightcycle_leaderboard';
const TOP_N = 10;

type Dir = 'up' | 'down' | 'left' | 'right';
type Phase = 'playing' | 'level-cleared' | 'game-over';

interface CycleState {
  x: number;
  y: number;
  dir: Dir;
  trail: Set<string>;
  alive: boolean;
}

interface LeaderEntry {
  name: string;
  level: number;
  score: number;
  date: string;
}

interface Props {
  onEnd: (result: 'win' | 'lose') => void;
  onSkip: () => void;
}

const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

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

// Scales tick + AI depth by level
function tickMsForLevel(level: number): number {
  return Math.max(28, 84 - (level - 1) * 8);
}
function aiDepthForLevel(level: number): number {
  return Math.min(140, 40 + (level - 1) * 22);
}

function aiChooseDir(c: CycleState, walls: Set<string>, depth: number): Dir {
  const measureDir = (d: Dir): number => {
    const next = moveOnce({ x: c.x, y: c.y, dir: d });
    if (isHit(next.x, next.y, walls)) return -1;
    const visited = new Set<string>([cellKey(next.x, next.y)]);
    const queue: { x: number; y: number }[] = [{ x: next.x, y: next.y }];
    let head = 0;
    while (head < queue.length && visited.size < depth) {
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
  const opts: { d: Dir; score: number }[] = [
    { d: c.dir, score: measureDir(c.dir) },
    { d: t1, score: measureDir(t1) },
    { d: t2, score: measureDir(t2) },
  ];
  opts.sort((a, b) => b.score - a.score);
  return opts[0].score >= 0 ? opts[0].d : c.dir;
}

function loadLeaderboard(): LeaderEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveToLeaderboard(entry: LeaderEntry): LeaderEntry[] {
  const board = loadLeaderboard();
  board.push(entry);
  board.sort((a, b) => b.score - a.score || b.level - a.level);
  const top = board.slice(0, TOP_N);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(top));
  return top;
}

export default function Lightcycle({ onEnd, onSkip }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ player: CycleState; ai: CycleState; level: number; score: number; phase: Phase }>({
    player: newCycle(6, Math.floor(ROWS / 2), 'right'),
    ai: newCycle(COLS - 7, Math.floor(ROWS / 2), 'left'),
    level: 1,
    score: 0,
    phase: 'playing',
  });
  const [, force] = useState(0);
  const tick = useCallback(() => force((n) => n + 1), []);

  const [showName, setShowName] = useState(false);
  const [name, setName] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);

  useEffect(() => {
    setLeaderboard(loadLeaderboard());
  }, []);

  // Cache last-known name so the input pre-fills
  useEffect(() => {
    const lastName = localStorage.getItem('lightcycle_last_name');
    if (lastName) setName(lastName);
  }, []);

  const startLevel = useCallback((level: number) => {
    stateRef.current.player = newCycle(6, Math.floor(ROWS / 2), 'right');
    stateRef.current.ai = newCycle(COLS - 7, Math.floor(ROWS / 2), 'left');
    stateRef.current.level = level;
    stateRef.current.phase = 'playing';
    tick();
  }, [tick]);

  const restartFresh = useCallback(() => {
    stateRef.current.score = 0;
    setScoreSaved(false);
    setShowName(false);
    startLevel(1);
  }, [startLevel]);

  const submitScore = useCallback(() => {
    const safeName = (name.trim() || 'AAA').slice(0, 10).toUpperCase();
    localStorage.setItem('lightcycle_last_name', safeName);
    const entry: LeaderEntry = {
      name: safeName,
      level: stateRef.current.level,
      score: stateRef.current.score,
      date: new Date().toLocaleDateString(),
    };
    setLeaderboard(saveToLeaderboard(entry));
    setScoreSaved(true);
    setShowName(false);
  }, [name]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    if (player.alive) {
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.fillRect(player.x * CELL, player.y * CELL, CELL, CELL);
      ctx.shadowBlur = 0;
    }
    if (ai.alive) {
      ctx.fillStyle = '#f0a000';
      ctx.shadowColor = '#f0a000';
      ctx.shadowBlur = 12;
      ctx.fillRect(ai.x * CELL, ai.y * CELL, CELL, CELL);
      ctx.shadowBlur = 0;
    }
  }, []);

  // Player input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (stateRef.current.phase !== 'playing') return;
      const map: Record<string, Dir> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up', W: 'up',
        s: 'down', S: 'down',
        a: 'left', A: 'left',
        d: 'right', D: 'right',
      };
      const dir = map[e.key];
      if (!dir) return;
      const opposite: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };
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
    draw();
    const loop = (t: number) => {
      const s = stateRef.current;
      if (s.phase !== 'playing') {
        draw();
        raf = requestAnimationFrame(loop);
        return;
      }
      const tickMs = tickMsForLevel(s.level);
      if (t - lastTick >= tickMs) {
        lastTick = t;
        const { player, ai } = s;
        const walls = new Set<string>();
        player.trail.forEach((k) => walls.add(k));
        ai.trail.forEach((k) => walls.add(k));

        // AI
        if (ai.alive) {
          ai.dir = aiChooseDir(ai, walls, aiDepthForLevel(s.level));
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

        // Player
        if (player.alive) {
          const next = moveOnce(player);
          if (isHit(next.x, next.y, walls)) {
            player.alive = false;
          } else {
            player.x = next.x;
            player.y = next.y;
            player.trail.add(cellKey(player.x, player.y));
            // 1 point per cell survived, scaled by level
            s.score += s.level;
          }
        }

        if (!player.alive && !ai.alive) {
          // Both die: counts as loss (AI doesn't lose first)
          s.phase = 'game-over';
          setShowName(true);
        } else if (!player.alive) {
          s.phase = 'game-over';
          setShowName(true);
        } else if (!ai.alive) {
          s.phase = 'level-cleared';
        }
        draw();
        tick();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw, tick]);

  const state = stateRef.current;
  const playerCells = state.player.trail.size - 1;

  const btnStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid rgba(0,240,255,0.45)',
    color: '#00f0ff',
    padding: '8px 16px',
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  };
  const btnPrimary: React.CSSProperties = {
    ...btnStyle,
    background: '#00f0ff',
    color: '#000',
    boxShadow: '0 0 16px rgba(0,240,255,0.6)',
  };
  const btnMuted: React.CSSProperties = {
    ...btnStyle,
    borderColor: 'rgba(0,240,255,0.25)',
    color: 'rgba(0,240,255,0.6)',
  };

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
        gap: 14,
        fontFamily: MONO,
        padding: 20,
      }}
    >
      {/* HUD */}
      <div
        style={{
          display: 'flex',
          gap: 28,
          color: 'rgba(0,240,255,0.55)',
          fontSize: 11,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        <span>Level <span style={{ color: '#00f0ff' }}>{state.level}</span></span>
        <span>Score <span style={{ color: '#00f0ff' }}>{state.score}</span></span>
        <span>Trail <span style={{ color: '#00f0ff' }}>{playerCells}</span></span>
      </div>

      <div style={{ color: 'rgba(0,240,255,0.45)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
        Arrows or WASD &middot; Don&apos;t crash
      </div>

      <canvas
        ref={canvasRef}
        width={COLS * CELL}
        height={ROWS * CELL}
        style={{
          border: '1px solid rgba(0,240,255,0.45)',
          boxShadow: '0 0 28px rgba(0,240,255,0.28)',
          maxWidth: '95vw',
          height: 'auto',
        }}
      />

      {/* Overlay messages + buttons */}
      <div style={{ minHeight: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        {state.phase === 'playing' && (
          <button onClick={onSkip} style={btnMuted}>
            Skip &rarr;
          </button>
        )}

        {state.phase === 'level-cleared' && (
          <>
            <div
              style={{
                color: '#00f0ff',
                fontSize: 20,
                letterSpacing: '0.22em',
                fontWeight: 800,
                textShadow: '0 0 14px rgba(0,240,255,0.6)',
              }}
            >
              LEVEL {state.level} CLEARED
            </div>
            <div style={{ color: 'rgba(0,240,255,0.6)', fontSize: 11, letterSpacing: '0.16em' }}>
              Run score: {state.score} &middot; Next level is faster
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => startLevel(state.level + 1)} style={btnPrimary}>
                Next Level
              </button>
              <button
                onClick={() => {
                  setShowName(true);
                  stateRef.current.phase = 'game-over';
                  tick();
                }}
                style={btnStyle}
              >
                End Run
              </button>
              <button onClick={onSkip} style={btnMuted}>
                To Board
              </button>
            </div>
          </>
        )}

        {state.phase === 'game-over' && (
          <GameOverPanel
            level={state.level}
            score={state.score}
            showName={showName}
            name={name}
            onNameChange={setName}
            onSubmit={submitScore}
            scoreSaved={scoreSaved}
            leaderboard={leaderboard}
            onRestart={restartFresh}
            onToBoard={() => onEnd('lose')}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

interface GameOverProps {
  level: number;
  score: number;
  showName: boolean;
  name: string;
  onNameChange: (n: string) => void;
  onSubmit: () => void;
  scoreSaved: boolean;
  leaderboard: LeaderEntry[];
  onRestart: () => void;
  onToBoard: () => void;
}

function GameOverPanel({
  level,
  score,
  showName,
  name,
  onNameChange,
  onSubmit,
  scoreSaved,
  leaderboard,
  onRestart,
  onToBoard,
}: GameOverProps) {
  const btnStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid rgba(0,240,255,0.45)',
    color: '#00f0ff',
    padding: '8px 16px',
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  };
  const btnPrimary: React.CSSProperties = {
    ...btnStyle,
    background: '#00f0ff',
    color: '#000',
    boxShadow: '0 0 16px rgba(0,240,255,0.6)',
  };
  const btnMuted: React.CSSProperties = {
    ...btnStyle,
    borderColor: 'rgba(0,240,255,0.25)',
    color: 'rgba(0,240,255,0.6)',
  };

  return (
    <>
      <div
        style={{
          color: '#f0a000',
          fontSize: 22,
          letterSpacing: '0.22em',
          fontWeight: 800,
          textShadow: '0 0 14px rgba(240,160,0,0.6)',
        }}
      >
        END OF LINE
      </div>
      <div style={{ color: 'rgba(240,160,0,0.65)', fontSize: 11, letterSpacing: '0.16em' }}>
        Final Score: <span style={{ color: '#f0a000', fontWeight: 700 }}>{score}</span> &middot; Reached Level {level}
      </div>

      {showName && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="AAA"
            maxLength={10}
            value={name}
            onChange={(e) => onNameChange(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit();
            }}
            style={{
              background: 'rgba(0,12,16,0.8)',
              border: '1px solid rgba(0,240,255,0.45)',
              color: '#00f0ff',
              padding: '8px 12px',
              fontFamily: MONO,
              fontSize: 14,
              letterSpacing: '0.2em',
              width: 120,
              textAlign: 'center',
              outline: 'none',
              textTransform: 'uppercase',
            }}
            autoFocus
          />
          <button onClick={onSubmit} style={btnPrimary}>
            Save
          </button>
        </div>
      )}

      {scoreSaved && (
        <>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.32em',
              color: 'rgba(0,240,255,0.5)',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginTop: 6,
            }}
          >
            Leaderboard
          </div>
          <div
            style={{
              background: 'rgba(0,12,16,0.7)',
              border: '1px solid rgba(0,240,255,0.25)',
              padding: '10px 16px',
              minWidth: 360,
              fontFamily: MONO,
              fontSize: 12,
              color: 'rgba(0,240,255,0.7)',
            }}
          >
            {leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>// no scores yet</div>
            ) : (
              leaderboard.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr 56px 56px',
                    gap: 12,
                    padding: '4px 0',
                    color: i === 0 ? '#00f0ff' : 'rgba(0,240,255,0.7)',
                  }}
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <span>{entry.name}</span>
                  <span style={{ textAlign: 'right' }}>L{entry.level}</span>
                  <span style={{ textAlign: 'right', color: i === 0 ? '#00f0ff' : '#e0f4f8' }}>{entry.score}</span>
                </div>
              ))
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button onClick={onRestart} style={btnPrimary}>
              New Run
            </button>
            <button onClick={onToBoard} style={btnMuted}>
              To Board
            </button>
          </div>
        </>
      )}
    </>
  );
}
