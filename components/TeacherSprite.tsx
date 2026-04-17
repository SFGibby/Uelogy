'use client';

// Prof. Uel — PixelLab-generated sprite (Sea of Stars-inspired JRPG style)
// Source PNG: /public/sprites/prof-uel.png (128×128, transparent bg)

const W = 128;
const H = 128;

const SPARKLES = [
  { cx: W - 6,  cy: 18,  delay: '0s',   dur: '2.6s' },
  { cx: 6,      cy: 54,  delay: '1.3s', dur: '2.8s' },
  { cx: W - 10, cy: 92,  delay: '0.7s', dur: '3.2s' },
];

export default function TeacherSprite() {
  return (
    <>
      <style>{`
        @keyframes teacherFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-4px); }
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
          animation: sparkleIn 2.8s ease-in-out infinite;
        }
      `}</style>

      <div style={{ position: 'relative', width: W, height: H + 8 }}>
        {/* Ground shadow */}
        <svg
          width={W}
          height={H + 8}
          viewBox={`0 0 ${W} ${H + 8}`}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
        >
          <ellipse cx={W / 2} cy={H + 2} rx={W / 3.4} ry={4} fill="rgba(10,14,28,0.28)" />

          {SPARKLES.map((s, i) => (
            <g key={i} className="teacher-sparkle" style={{ animationDelay: s.delay, animationDuration: s.dur, transformOrigin: `${s.cx}px ${s.cy}px` }}>
              <line x1={s.cx} y1={s.cy - 5} x2={s.cx} y2={s.cy + 5} stroke="#ffd166" strokeWidth="1.6" strokeLinecap="round" />
              <line x1={s.cx - 5} y1={s.cy} x2={s.cx + 5} y2={s.cy} stroke="#ffd166" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx={s.cx} cy={s.cy} r="1.2" fill="#fff6d6" />
            </g>
          ))}
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
