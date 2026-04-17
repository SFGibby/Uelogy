'use client';

// Sea of Stars style teacher character
// 12 wide × 18 tall at PX=3 → 36×54px

const PX = 3;

const C: Record<number, string> = {
  1: '#2d1b0e', // dark hair
  2: '#c07d52', // warm skin
  3: '#1a4875', // blazer dark
  4: '#2a6499', // blazer mid
  5: '#f0ead8', // white shirt / collar
  6: '#0d1927', // dark detail (eyes, pants)
  7: '#7b5015', // glasses frame
  8: '#ffd166', // gold pin
  9: '#2d1606', // shoes
};

// Big head (~39% of height), teacher blazer with lapels, gold pin, glasses
const SPRITE: number[][] = [
  [0,0,1,1,1,1,1,1,0,0,0,0], //  0 hair top
  [0,1,1,1,1,1,1,1,1,0,0,0], //  1 hair
  [0,1,1,2,2,2,2,1,1,0,0,0], //  2 face + hair sides
  [0,1,2,2,2,2,2,2,1,0,0,0], //  3 face
  [0,1,2,7,6,2,6,7,1,0,0,0], //  4 glasses
  [0,1,2,7,2,2,2,7,1,0,0,0], //  5 glasses lower frame
  [0,1,2,2,2,6,2,2,1,0,0,0], //  6 smile
  [0,3,3,5,5,5,3,3,3,0,0,0], //  7 shoulders + white collar
  [0,3,5,5,5,5,5,3,0,0,0,0], //  8 shirt
  [0,3,5,3,3,3,5,3,0,0,0,0], //  9 blazer lapels open
  [0,3,3,3,8,3,3,3,0,0,0,0], // 10 blazer body + gold pin
  [0,3,3,3,3,3,3,3,0,0,0,0], // 11 blazer lower
  [0,6,6,6,6,6,6,6,0,0,0,0], // 12 dark pants waist
  [0,0,6,6,0,6,6,0,0,0,0,0], // 13 legs
  [0,0,6,6,0,6,6,0,0,0,0,0], // 14 legs
  [0,0,6,6,0,6,6,0,0,0,0,0], // 15 legs lower
  [0,0,9,9,0,9,9,0,0,0,0,0], // 16 shoes
  [0,9,9,9,0,9,9,9,0,0,0,0], // 17 shoe tips
];

const W = SPRITE[0].length * PX;
const H = SPRITE.length * PX;

// Small star sparkles that pulse around the character (Sea of Stars feel)
const SPARKLES = [
  { cx: W + 6, cy: 10, delay: '0s',    dur: '2.4s' },
  { cx: -6,   cy: 24, delay: '1.2s',   dur: '2.4s' },
  { cx: W + 2, cy: 40, delay: '0.6s',  dur: '3.0s' },
];

export default function TeacherSprite() {
  return (
    <>
      <style>{`
        @keyframes teacherFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes sparkleIn {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          40%, 60% { opacity: 1; transform: scale(1) rotate(45deg); }
        }
        .teacher-body {
          animation: teacherFloat 2.6s ease-in-out infinite;
          transform-origin: bottom center;
          image-rendering: pixelated;
          filter: drop-shadow(0 4px 8px rgba(78,205,196,0.15));
        }
        .teacher-sparkle {
          animation: sparkleIn 2.4s ease-in-out infinite;
        }
      `}</style>

      <div style={{ position: 'relative', width: W + 16, height: H + 8 }}>
        {/* Sparkle stars */}
        <svg
          width={W + 16}
          height={H + 8}
          viewBox={`-8 0 ${W + 16} ${H + 8}`}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
        >
          {SPARKLES.map((s, i) => (
            <g key={i} className="teacher-sparkle" style={{ animationDelay: s.delay, animationDuration: s.dur }}>
              <line x1={s.cx} y1={s.cy - 4} x2={s.cx} y2={s.cy + 4} stroke="#ffd166" strokeWidth="1.5" />
              <line x1={s.cx - 4} y1={s.cy} x2={s.cx + 4} y2={s.cy} stroke="#ffd166" strokeWidth="1.5" />
            </g>
          ))}
        </svg>

        {/* Sprite body */}
        <div className="teacher-body" style={{ position: 'absolute', left: 8, top: 0, width: W, height: H }}>
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ display: 'block', imageRendering: 'pixelated' }}
          >
            {SPRITE.map((row, ri) =>
              row.map((cell, ci) => {
                if (!cell) return null;
                return (
                  <rect
                    key={`${ri}-${ci}`}
                    x={ci * PX}
                    y={ri * PX}
                    width={PX}
                    height={PX}
                    fill={C[cell]}
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
