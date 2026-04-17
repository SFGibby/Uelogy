'use client';

// Pixel size in px per grid cell
const PX = 5;

// Color map
const C: Record<number, string> = {
  1: '#1a0c03', // dark hair
  2: '#c8855a', // skin
  3: '#e4d8be', // cream shirt
  4: '#3a6a9f', // blue jeans
  5: '#5a3010', // brown boots
  6: '#0a0502', // dark detail (eyes, beard)
  7: '#b8a888', // shirt shadow
};

// Sprite grid — 14 wide × 22 tall
// 0 = transparent
const SPRITE: number[][] = [
  [0,0,1,1,1,1,1,1,1,1,1,0,0,0], //  0 hair top
  [0,1,1,1,1,1,1,1,1,1,1,1,0,0], //  1 hair
  [1,1,1,1,1,1,1,1,1,1,1,1,1,0], //  2 hair wide
  [1,1,1,2,2,2,2,2,2,2,1,1,1,0], //  3 face + hair sides
  [1,1,2,2,2,2,2,2,2,2,2,1,1,0], //  4 face
  [1,1,2,2,6,2,2,2,6,2,2,1,1,0], //  5 eyes
  [1,1,2,6,2,6,6,2,6,2,1,1,1,0], //  6 beard shadow
  [1,1,6,6,2,2,2,2,6,6,1,1,1,0], //  7 beard/chin
  [1,3,3,3,3,3,3,3,3,3,3,3,1,0], //  8 shoulders (hair drapes sides)
  [1,3,3,3,3,3,3,3,3,3,3,3,1,0], //  9 torso
  [1,3,3,3,3,3,3,3,3,3,3,3,1,0], // 10 torso
  [1,3,3,3,3,3,3,3,3,3,3,3,0,0], // 11 torso
  [1,3,3,3,3,3,3,3,3,3,3,0,0,0], // 12 torso lower — hair thins
  [1,3,3,3,3,3,3,3,3,3,0,0,0,0], // 13 torso / hair end
  [0,4,4,4,4,4,4,4,4,4,0,0,0,0], // 14 jeans waist
  [0,4,4,4,0,0,0,4,4,4,0,0,0,0], // 15 jeans upper legs
  [0,4,4,0,0,0,0,0,4,4,0,0,0,0], // 16 jeans legs
  [0,4,4,0,0,0,0,0,4,4,0,0,0,0], // 17 jeans legs
  [0,4,4,0,0,0,0,0,4,4,0,0,0,0], // 18 jeans lower
  [0,5,5,5,0,0,0,5,5,5,0,0,0,0], // 19 boots
  [0,5,5,5,0,0,0,5,5,5,0,0,0,0], // 20 boots
  [0,0,5,5,0,0,0,0,5,5,0,0,0,0], // 21 boot tips
];

const W = SPRITE[0].length * PX;
const H = SPRITE.length * PX;

export default function SamSprite() {
  return (
    <>
      <style>{`
        @keyframes samBounce {
          0%   { transform: translateY(0px) scaleY(1) scaleX(1); }
          18%  { transform: translateY(-9px) scaleY(1.06) scaleX(0.95); }
          36%  { transform: translateY(0px) scaleY(0.92) scaleX(1.08); }
          50%  { transform: translateY(-4px) scaleY(1.02) scaleX(0.99); }
          65%  { transform: translateY(0px) scaleY(1) scaleX(1); }
          100% { transform: translateY(0px) scaleY(1) scaleX(1); }
        }
        @keyframes hairSway {
          0%, 100% { transform: skewX(0deg); }
          30%      { transform: skewX(1.5deg); }
          70%      { transform: skewX(-1.5deg); }
        }
        .sam-sprite-body {
          animation: samBounce 750ms ease-in-out infinite;
          transform-origin: bottom center;
          image-rendering: pixelated;
        }
        .sam-sprite-hair {
          animation: hairSway 1200ms ease-in-out infinite;
          transform-origin: top center;
        }
      `}</style>

      <div className="sam-sprite-body" style={{ width: W, height: H, position: 'relative' }}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ display: 'block', imageRendering: 'pixelated' }}
        >
          {SPRITE.map((row, ri) =>
            row.map((cell, ci) => {
              if (!cell) return null;
              const isHair = cell === 1;
              return (
                <rect
                  key={`${ri}-${ci}`}
                  x={ci * PX}
                  y={ri * PX}
                  width={PX}
                  height={PX}
                  fill={C[cell]}
                  className={isHair ? 'sam-sprite-hair' : undefined}
                />
              );
            })
          )}
        </svg>
      </div>
    </>
  );
}
