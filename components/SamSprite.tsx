'use client';

// Pixel size in px per grid cell
const PX = 4;

// Color map
const C: Record<number, string> = {
  1: '#1a0c03', // dark hair
  2: '#c8855a', // skin
  3: '#e4d8be', // cream shirt
  4: '#3a6a9f', // blue jeans
  5: '#5a3010', // brown boots
  6: '#0a0502', // dark detail (eyes, beard)
};

// OG Mario proportions — big head (~47%), narrow torso, stubby legs
// 10 wide × 15 tall
const SPRITE: number[][] = [
  [0,0,1,1,1,1,1,1,0,0], //  0 hair top
  [0,1,1,1,1,1,1,1,1,0], //  1 hair
  [1,1,1,2,2,2,2,1,1,0], //  2 face + hair sides
  [1,1,2,2,2,2,2,2,1,0], //  3 face
  [1,1,2,6,2,2,6,2,1,0], //  4 eyes
  [1,1,2,2,6,6,2,2,1,0], //  5 nose / beard
  [1,1,6,6,2,2,6,6,1,0], //  6 chin / beard
  [1,3,3,3,3,3,3,1,0,0], //  7 shoulders (hair drapes both sides)
  [1,0,3,3,3,3,3,0,0,0], //  8 torso (narrow — 5px body, hair left side)
  [1,0,3,3,3,3,3,0,0,0], //  9 torso lower
  [0,0,4,4,4,4,4,0,0,0], // 10 jeans waist
  [0,0,4,4,0,4,4,0,0,0], // 11 jeans — legs split
  [0,0,4,4,0,4,4,0,0,0], // 12 jeans lower
  [0,0,5,5,0,5,5,0,0,0], // 13 boots
  [0,5,5,5,0,5,5,5,0,0], // 14 boot tips (wider)
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
