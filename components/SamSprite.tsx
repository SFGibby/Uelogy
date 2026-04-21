'use client';

// Pixel size in px per grid cell
const PX = 4;

// Color map
const C: Record<number, string> = {
  1: '#0d0603',  // hair dark
  2: '#2d1a0b',  // hair highlight
  3: '#d19068',  // skin mid
  4: '#a5663f',  // skin shadow
  5: '#5a3010',  // boots
  6: '#0a0502',  // dark detail (eyes, beard)
  7: '#e4d8be',  // shirt cream
  8: '#a89a7c',  // shirt shadow
  9: '#3a6a9f',  // jeans
  10: '#2b1508', // boot sole / dark
};

// Mario-proportioned Sam — 12 wide × 19 tall with shading
const SPRITE: number[][] = [
  [0,0,0,1,1,1,1,1,1,0,0,0], //  0 hair crown
  [0,0,1,1,2,2,2,2,1,1,0,0], //  1 hair with highlight
  [0,1,1,2,2,2,2,2,2,1,1,0], //  2 hair widens
  [0,1,2,3,3,3,3,3,3,2,1,0], //  3 hair sides → forehead
  [1,2,3,3,3,3,3,3,3,3,2,1], //  4 face widest (temples)
  [1,2,3,6,3,3,3,3,6,3,2,1], //  5 eyes
  [1,2,3,3,3,4,4,3,3,3,2,1], //  6 nose shadow
  [0,1,2,3,6,6,6,6,3,2,1,0], //  7 moustache line
  [0,1,2,6,6,6,6,6,6,2,1,0], //  8 beard body
  [0,0,1,6,6,6,6,6,6,1,0,0], //  9 beard narrows
  [0,0,0,1,6,6,6,6,1,0,0,0], // 10 chin beard
  [0,0,0,7,7,7,7,7,7,0,0,0], // 11 collar
  [0,7,7,7,7,8,8,7,7,7,7,0], // 12 shoulders widen
  [7,7,7,7,7,7,7,7,7,7,7,7], // 13 arms fill full width
  [7,7,8,7,7,7,7,7,7,8,7,7], // 14 armpit shadow seam
  [7,7,7,9,9,9,9,9,9,7,7,7], // 15 sleeves flanking jeans waist
  [3,3,3,9,9,0,0,9,9,3,3,3], // 16 hands (3-wide) beside legs split
  [0,0,0,5,5,0,0,5,5,0,0,0], // 17 boots
  [0,0,5,10,5,0,0,5,10,5,0,0], // 18 boot widen with sole
];

const W = SPRITE[0].length * PX;
const H = SPRITE.length * PX;

// Same drop-speed formula as BlockDrop: max(100, 800 - (level-1)*70) ms
function bounceDuration(level: number): number {
  return Math.max(100, 800 - (level - 1) * 70);
}

export default function SamSprite({ level = 1 }: { level?: number }) {
  const duration = bounceDuration(level);
  return (
    <>
      <style>{`
        @keyframes samBounce {
          0%   { transform: translateY(0px) scaleY(1) scaleX(1); }
          18%  { transform: translateY(-7px) scaleY(1.07) scaleX(0.94); }
          36%  { transform: translateY(0px) scaleY(0.91) scaleX(1.09); }
          50%  { transform: translateY(-3px) scaleY(1.02) scaleX(0.99); }
          65%  { transform: translateY(0px) scaleY(1) scaleX(1); }
          100% { transform: translateY(0px) scaleY(1) scaleX(1); }
        }
        .sam-sprite-body {
          animation: samBounce 750ms ease-in-out infinite;
          transform-origin: bottom center;
          image-rendering: pixelated;
        }
      `}</style>

      <div
        className="sam-sprite-body"
        style={{ width: W, height: H, position: 'relative', animationDuration: `${duration}ms` }}
      >
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
    </>
  );
}
