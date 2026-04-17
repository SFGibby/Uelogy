'use client';

// Prof. Uel — static PixelLab-generated sprite (husky build).
// Source PNG: /public/sprites/prof-uel.png (128×128, transparent bg)

const W = 128;
const H = 128;

export default function TeacherSprite() {
  return (
    <>
      <style>{`
        @keyframes teacherFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-3px); }
        }
        .teacher-body {
          animation: teacherFloat 3.2s ease-in-out infinite;
          transform-origin: bottom center;
          image-rendering: pixelated;
          filter: drop-shadow(0 6px 4px rgba(10,10,20,0.35));
        }
      `}</style>

      <div style={{ position: 'relative', width: W, height: H + 8 }}>
        <svg
          width={W}
          height={H + 8}
          viewBox={`0 0 ${W} ${H + 8}`}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
        >
          <ellipse cx={W / 2} cy={H + 2} rx={W / 3.4} ry={4} fill="rgba(10,14,28,0.28)" />
        </svg>

        <img
          src="/sprites/prof-uel.png"
          alt="Prof. Uel"
          width={W}
          height={H}
          className="teacher-body"
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
