'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

const COLS = 10;
const ROWS = 20;
const LEADERBOARD_KEY = 'blockdrop_leaderboard';

// Milestone thresholds: milestone fires when score >= pts OR tetrises >= clears
const MILESTONES = [
  { pts: 1000, clears: 1 },
  { pts: 2000, clears: 2 },
  { pts: 3000, clears: 3 },
];

const PIECES = [
  [],
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[1,0],[1,0],[1,1]],
  [[0,1],[0,1],[1,1]],
  [[1,1,0],[0,1,1]],
  [[0,1,1],[1,1,0]],
];

type Grid = number[][];
type Piece = { shape: number[][]; x: number; y: number };
type LeaderboardEntry = { name: string; score: number; date: string };

function createGrid(): Grid { return Array.from({length:ROWS},()=>Array(COLS).fill(0)); }
function randomPiece(): Piece {
  const idx = Math.floor(Math.random()*(PIECES.length-1))+1;
  const shape = PIECES[idx];
  return {shape, x: Math.floor(COLS/2)-Math.floor(shape[0].length/2), y:0};
}
function rotate(shape: number[][]): number[][] { return shape[0].map((_,i)=>shape.map(r=>r[i]).reverse()); }
function collides(grid:Grid, piece:Piece, dx=0, dy=0, ns?:number[][]): boolean {
  const shape = ns||piece.shape;
  for(let r=0;r<shape.length;r++) for(let c=0;c<shape[r].length;c++){
    if(!shape[r][c]) continue;
    const nx=piece.x+c+dx, ny=piece.y+r+dy;
    if(nx<0||nx>=COLS||ny>=ROWS) return true;
    if(ny>=0&&grid[ny][nx]) return true;
  }
  return false;
}
function merge(grid:Grid, piece:Piece): Grid {
  const g=grid.map(r=>[...r]);
  piece.shape.forEach((row,r)=>row.forEach((val,c)=>{if(val&&piece.y+r>=0)g[piece.y+r][piece.x+c]=val;}));
  return g;
}
function clearLines(grid:Grid): {grid:Grid; cleared:number} {
  const ng=grid.filter(row=>row.some(c=>!c));
  const cleared=ROWS-ng.length;
  return {grid:[...Array.from({length:cleared},()=>Array(COLS).fill(0)),...ng], cleared};
}
function loadLeaderboard(): LeaderboardEntry[] {
  try { return JSON.parse(localStorage.getItem(LEADERBOARD_KEY)||'[]'); } catch { return []; }
}
function saveToLeaderboard(entry:LeaderboardEntry): LeaderboardEntry[] {
  const board=loadLeaderboard();
  board.push(entry); board.sort((a,b)=>b.score-a.score);
  const top10=board.slice(0,10);
  localStorage.setItem(LEADERBOARD_KEY,JSON.stringify(top10));
  return top10;
}

interface BlockDropProps {
  onMilestone?: (level: number) => void;
  onGameEnd?: () => void;
}

export default function BlockDrop({ onMilestone, onGameEnd }: BlockDropProps) {
  const stateRef = useRef({
    grid: createGrid(), piece: randomPiece(), next: randomPiece(),
    score:0, lines:0, level:1, tetrises:0, milestone:0,
    gameOver:false, paused:false, started:false,
  });
  const [, forceUpdate] = useState(0);
  const [showNameInput, setShowNameInput] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const dropCounter = useRef(0);
  const onMilestoneRef = useRef(onMilestone);
  onMilestoneRef.current = onMilestone;

  useEffect(()=>{ setLeaderboard(loadLeaderboard()); },[]);

  const tick = useCallback(()=>{ forceUpdate(n=>n+1); },[]);

  const checkMilestones = useCallback((score: number, tetrises: number, current: number): number => {
    let next = current;
    for (let i = current; i < MILESTONES.length; i++) {
      const m = MILESTONES[i];
      if (score >= m.pts || tetrises >= m.clears) {
        next = i + 1;
      }
    }
    if (next > current) onMilestoneRef.current?.(next);
    return next;
  }, []);

  const drop = useCallback(()=>{
    const s=stateRef.current;
    if(s.gameOver||s.paused||!s.started) return;
    if(!collides(s.grid,s.piece,0,1)){ s.piece.y++; }
    else {
      s.grid=merge(s.grid,s.piece);
      const {grid,cleared}=clearLines(s.grid); s.grid=grid;
      s.lines+=cleared;
      s.score+=[0,100,300,500,800][cleared]*s.level;
      s.level=Math.floor(s.lines/10)+1;
      if(cleared===4) s.tetrises++;
      s.milestone=checkMilestones(s.score, s.tetrises, s.milestone);
      s.piece=s.next; s.next=randomPiece();
      if(collides(s.grid,s.piece)){ s.gameOver=true; setShowNameInput(true); }
    }
    tick();
  },[tick, checkMilestones]);

  const gameLoop = useCallback((time:number)=>{
    const s=stateRef.current;
    if(!s.paused&&!s.gameOver&&s.started){
      const delta=time-lastTimeRef.current; lastTimeRef.current=time; dropCounter.current+=delta;
      const speed=Math.max(100,800-(s.level-1)*70);
      if(dropCounter.current>speed){ drop(); dropCounter.current=0; }
    }
    rafRef.current=requestAnimationFrame(gameLoop);
  },[drop]);

  const startGame = useCallback(()=>{
    const s=stateRef.current;
    s.grid=createGrid(); s.piece=randomPiece(); s.next=randomPiece();
    s.score=0; s.lines=0; s.level=1; s.tetrises=0; s.milestone=0;
    s.gameOver=false; s.started=true; s.paused=false;
    setShowNameInput(false); setNameInput(''); setShowLeaderboard(false);
    tick();
  },[tick]);

  const submitScore = useCallback(()=>{
    const entry:LeaderboardEntry={name:(nameInput.trim()||'AAA').slice(0,10).toUpperCase(), score:stateRef.current.score, date:new Date().toLocaleDateString()};
    setLeaderboard(saveToLeaderboard(entry));
    setShowNameInput(false); setShowLeaderboard(true);
    onGameEnd?.();
  },[nameInput, onGameEnd]);

  useEffect(()=>{ rafRef.current=requestAnimationFrame(gameLoop); return()=>cancelAnimationFrame(rafRef.current); },[gameLoop]);

  useEffect(()=>{
    const handleKey=(e:KeyboardEvent)=>{
      const s=stateRef.current;
      if(showNameInput) return;
      if(!s.started||s.gameOver) return;
      if(e.key==='p'||e.key==='P'){ s.paused=!s.paused; tick(); return; }
      if(s.paused) return;
      switch(e.key){
        case 'ArrowLeft': e.preventDefault(); if(!collides(s.grid,s.piece,-1))s.piece.x--; break;
        case 'ArrowRight': e.preventDefault(); if(!collides(s.grid,s.piece,1))s.piece.x++; break;
        case 'ArrowDown': e.preventDefault(); drop(); dropCounter.current=0; break;
        case 'ArrowUp': { e.preventDefault(); const rot=rotate(s.piece.shape); if(!collides(s.grid,s.piece,0,0,rot))s.piece.shape=rot; break; }
        case ' ': { e.preventDefault(); let dy=0; while(!collides(s.grid,s.piece,0,dy+1))dy++; s.piece.y+=dy; drop(); break; }
      }
      tick();
    };
    window.addEventListener('keydown',handleKey);
    return()=>window.removeEventListener('keydown',handleKey);
  },[drop,tick,showNameInput]);

  const s = stateRef.current;

  const renderGrid = () => {
    const rows: string[] = [];
    for(let r=0;r<ROWS;r++){
      let row='<!';
      for(let c=0;c<COLS;c++){
        const inPiece = s.started && !s.gameOver && s.piece.shape.some((pr,ri)=>pr.some((pv,ci)=>pv&&s.piece.y+ri===r&&s.piece.x+ci===c));
        if(inPiece) row+='[]';
        else if(s.grid[r][c]) row+='[]';
        else row+='. ';
      }
      row+='!>';
      rows.push(row);
    }
    rows.push('<!====================!>');
    rows.push('  \\/\\/\\/\\/\\/\\/\\/\\/\\/\\/  ');
    return rows;
  };

  const renderNext = () => {
    const rows: string[] = [];
    for(let r=0;r<4;r++){
      let row='';
      for(let c=0;c<4;c++){
        const inNext = s.next.shape[r]?.[c];
        row += inNext ? '[]' : '  ';
      }
      rows.push(row);
    }
    return rows;
  };

  const gridRows = renderGrid();
  const nextRows = renderNext();

  return (
    <div className="flex items-start gap-8 font-mono select-none" style={{fontFamily:'var(--font-vt323), monospace', fontSize:'20px', lineHeight:'1.2', color:'#33ff33', textShadow:'0 0 8px #33ff33'}}>

      {/* Left stats */}
      <div className="flex flex-col gap-2 pt-2 min-w-[140px]">
        <div>LINES:  {s.lines}</div>
        <div>LEVEL:  {s.level}</div>
        <div>SCORE:  {s.score}</div>
        <div className="mt-4">NEXT:</div>
        {nextRows.map((row,i)=><div key={i}>{row||'\u00a0'}</div>)}
        <div className="mt-4 text-[#1aaa1a] leading-relaxed text-sm">
          <div>{'<-'} {'->'}  MOVE</div>
          <div>{' ^ '}     ROTATE</div>
          <div>{' v '}     SPEED</div>
          <div>SPC   DROP</div>
          <div>P     PAUSE</div>
        </div>
        {leaderboard.length>0&&!showLeaderboard&&s.started&&(
          <button onClick={()=>setShowLeaderboard(true)} className="mt-4 text-left text-[#1aaa1a] hover:text-[#33ff33] transition-colors">SCORES &gt;</button>
        )}
      </div>

      {/* Game board */}
      <div className="relative">
        <div>
          {gridRows.map((row,i)=><div key={i}>{row}</div>)}
        </div>

        {/* Start screen */}
        {!s.started&&!showLeaderboard&&(
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-6">
            <div className="text-center leading-relaxed">
              <div>BLOCK DROP</div>
              <div className="text-[#1aaa1a] text-sm mt-1">USE ARROW KEYS</div>
            </div>
            <button onClick={startGame} className="border border-[#33ff33] px-6 py-1 hover:bg-[#33ff33] hover:text-black transition-all">PLAY</button>
            {leaderboard.length>0&&(
              <button onClick={()=>setShowLeaderboard(true)} className="text-[#1aaa1a] text-sm hover:text-[#33ff33] transition-colors">SCORES</button>
            )}
          </div>
        )}

        {/* Paused */}
        {s.paused&&(
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div>-- PAUSED --</div>
          </div>
        )}

        {/* Game over / name input */}
        {showNameInput&&(
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-4">
            <div>GAME OVER</div>
            <div>SCORE: {s.score}</div>
            <div className="text-[#1aaa1a] text-sm">ENTER YOUR NAME:</div>
            <input
              autoFocus value={nameInput}
              onChange={e=>setNameInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&submitScore()}
              maxLength={10}
              className="bg-black border border-[#33ff33] text-[#33ff33] px-3 py-1 text-center outline-none w-40"
              style={{fontFamily:'var(--font-vt323), monospace', fontSize:'20px', caretColor:'#33ff33'}}
              placeholder="_ _ _ _ _"
            />
            <button onClick={submitScore} className="border border-[#33ff33] px-6 py-1 hover:bg-[#33ff33] hover:text-black transition-all">SAVE</button>
            <button onClick={()=>{onGameEnd?.(); startGame();}} className="text-[#1aaa1a] text-sm hover:text-[#33ff33]">SKIP</button>
          </div>
        )}

        {/* Leaderboard */}
        {showLeaderboard&&(
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 gap-2 px-4">
            <div className="mb-2">-- TOP SCORES --</div>
            {(() => {
              const topReal = leaderboard[0]?.score ?? 0;
              const ghost = { name: 'SAMUEL G', score: topReal + 10 };
              const displayed = [ghost, ...leaderboard.slice(0,9)];
              return displayed.map((e,i)=>(
                <div key={i} className="flex gap-4 w-full justify-between text-sm">
                  <span className="text-[#1aaa1a]">{i+1}.</span>
                  <span className="flex-1">{e.name}</span>
                  <span>{e.score}</span>
                </div>
              ));
            })()}
            <button onClick={()=>{setShowLeaderboard(false);startGame();}} className="mt-4 border border-[#33ff33] px-6 py-1 hover:bg-[#33ff33] hover:text-black transition-all">PLAY</button>
            {!s.started&&<button onClick={()=>setShowLeaderboard(false)} className="text-[#1aaa1a] text-sm hover:text-[#33ff33]">BACK</button>}
          </div>
        )}
      </div>
    </div>
  );
}
