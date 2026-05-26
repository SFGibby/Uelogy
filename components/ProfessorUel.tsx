'use client';

// Professor Uel — the through-line teacher character for the Learning section.
// Currently one PNG (PixelLab-generated, husky build). Pose prop is reserved
// for additional sprites (pointing, celebrating, etc.) to be added later.

type Pose = 'idle';

const POSE_SRC: Record<Pose, string> = {
  idle: '/sprites/prof-uel.png',
};

const W = 128;
const H = 128;

interface Props {
  pose?: Pose;
  scale?: number; // 1 = native 128px
}

export default function ProfessorUel({ pose = 'idle', scale = 1 }: Props) {
  const w = Math.round(W * scale);
  const h = Math.round(H * scale);
  return (
    <>
      <style>{`
        @keyframes uelFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-3px); }
        }
        .uel-body {
          animation: uelFloat 3.2s ease-in-out infinite;
          transform-origin: bottom center;
          image-rendering: pixelated;
          filter: drop-shadow(0 6px 4px rgba(10,10,20,0.35));
        }
      `}</style>

      <div style={{ position: 'relative', width: w, height: h + 8 }}>
        <svg
          width={w}
          height={h + 8}
          viewBox={`0 0 ${w} ${h + 8}`}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
        >
          <ellipse cx={w / 2} cy={h + 2} rx={w / 3.4} ry={4} fill="rgba(10,14,28,0.28)" />
        </svg>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={POSE_SRC[pose]}
          alt="Professor Uel"
          width={w}
          height={h}
          className="uel-body"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            display: 'block',
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </>
  );
}
