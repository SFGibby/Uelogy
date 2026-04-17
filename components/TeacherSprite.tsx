'use client';

// Sea of Stars inspired teacher sprite — Prof. Uel
// 16 wide × 32 tall pixel grid, rendered at PX=4 → 64×128
// Taller proportions than classic 8-bit, 3+ tones per region, soft burgundy outline

const PX = 4;

const C: Record<string, string> = {
  o: '#2a1820', // soft dark outline (burgundy-brown, not black)
  H: '#a87a48', // hair highlight (warm brown)
  h: '#5a3620', // hair mid
  d: '#32180c', // hair shadow
  s: '#fbd9b4', // skin highlight
  n: '#e8b088', // skin mid
  k: '#a06040', // skin shadow
  e: '#1a1828', // eye
  f: '#3a2818', // glasses frame
  l: '#cfe4eb', // glass tint
  w: '#f2ecde', // shirt white
  W: '#bdb49a', // shirt shadow
  t: '#a02a2c', // tie highlight (burgundy)
  T: '#5a1418', // tie deep
  b: '#1e3a5e', // blazer mid (navy)
  B: '#0c1e3c', // blazer shadow
  L: '#3a5680', // blazer highlight
  p: '#3a2e1e', // pants mid (khaki-brown)
  P: '#1a140a', // pants shadow
  x: '#2a180a', // shoe mid
  X: '#5a3a20', // shoe highlight
  '.': '',      // transparent
};

// 16 wide × 32 tall. Each char = 1 pixel.
const SPRITE: string[] = [
  '....oooooooo....', //  0 hair top
  '...oHHhhhhhho...', //  1 hair highlight
  '..oHhhhhhhhddo..', //  2 hair with dark side
  '..ohhsnnnnshhdo.', //  3 forehead + skin highlight
  '..ohnssnnnsnkho.', //  4 face top
  '..ohnffooffneho.', //  5 glasses frame top
  '..ohnfleelfnkho.', //  6 lens + eye
  '..ohnffooffnkho.', //  7 glasses lower
  '..ohnsnnnnnnsho.', //  8 cheeks
  '...onnnntnnnko..', //  9 tiny mouth
  '...oonnnnnnoo...', // 10 chin
  '.....onnnno.....', // 11 neck
  '...oBLwwwwLBo...', // 12 collar + shoulders
  '..oBLwwWWwwwLBo.', // 13 collar open
  '..oBLLwwTwwbLBo.', // 14 lapels + tie start
  '..oBbLwTtTwbbBo.', // 15
  '..oBbbwTtTwbbBo.', // 16
  '..oBbbwTtTwbbBo.', // 17
  '..oBbbwTtTwbbBo.', // 18
  '..oBbbbbTbbbbBo.', // 19 blazer closes over tie
  '..oBbbbbbbbbbBo.', // 20
  '..oBBbbbbbbbBBo.', // 21
  '...oBBBbbbBBBo..', // 22 blazer hem
  '....oppppppo....', // 23 pants waist
  '...opPppppPpo...', // 24
  '...opPppppPpo...', // 25
  '...opPppppPpo...', // 26
  '...opPppppPpo...', // 27
  '...opPpoopPpo...', // 28 legs separate
  '...opPpo.oPpo...', // 29
  '..oxxxxo.oxxxxo.', // 30 shoes
  '.oxXXxxo.oxXXxxo', // 31 shoe tips
];

const W = SPRITE[0].length * PX;
const H = SPRITE.length * PX;

// Soft sparkles (Sea of Stars signature twinkle)
const SPARKLES = [
  { cx: W + 8,  cy: 16, delay: '0s',   dur: '2.6s' },
  { cx: -8,     cy: 40, delay: '1.3s', dur: '2.8s' },
  { cx: W + 4,  cy: 72, delay: '0.7s', dur: '3.2s' },
];

export default function TeacherSprite() {
  return (
    <>
      <style>{`
        @keyframes teacherFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes sparkleIn {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          40%, 60% { opacity: 1; transform: scale(1) rotate(45deg); }
        }
        .teacher-body {
          animation: teacherFloat 3.2s ease-in-out infinite;
          transform-origin: bottom center;
          image-rendering: pixelated;
          filter: drop-shadow(0 6px 4px rgba(10,10,20,0.35));
        }
        .teacher-sparkle {
          animation: sparkleIn 2.6s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>

      <div style={{ position: 'relative', width: W + 24, height: H + 12 }}>
        <svg
          width={W + 24}
          height={H + 12}
          viewBox={`-12 0 ${W + 24} ${H + 12}`}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
        >
          {/* Ground shadow ellipse under feet */}
          <ellipse cx={W / 2} cy={H + 4} rx={W / 2.6} ry={4} fill="rgba(10,14,28,0.28)" />

          {/* Sparkle stars */}
          {SPARKLES.map((s, i) => (
            <g key={i} className="teacher-sparkle" style={{ animationDelay: s.delay, animationDuration: s.dur, transformOrigin: `${s.cx}px ${s.cy}px` }}>
              <line x1={s.cx} y1={s.cy - 5} x2={s.cx} y2={s.cy + 5} stroke="#ffd166" strokeWidth="1.6" strokeLinecap="round" />
              <line x1={s.cx - 5} y1={s.cy} x2={s.cx + 5} y2={s.cy} stroke="#ffd166" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx={s.cx} cy={s.cy} r="1.2" fill="#fff6d6" />
            </g>
          ))}
        </svg>

        <div className="teacher-body" style={{ position: 'absolute', left: 12, top: 0, width: W, height: H }}>
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ display: 'block', imageRendering: 'pixelated' }}
            shapeRendering="crispEdges"
          >
            {SPRITE.map((row, ri) =>
              row.split('').map((ch, ci) => {
                const fill = C[ch];
                if (!fill) return null;
                return (
                  <rect
                    key={`${ri}-${ci}`}
                    x={ci * PX}
                    y={ri * PX}
                    width={PX}
                    height={PX}
                    fill={fill}
                  />
                );
              })
            )}
          </svg>
        </div>
      </div>
    </>
  );
}
