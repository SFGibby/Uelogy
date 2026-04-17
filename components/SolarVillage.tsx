'use client';

// Solar village — composed from PixelLab-generated PNG assets (SoS-style).
// Assets: /public/sprites/house-{beige,sage,blue}.png (128×128),
//         /public/sprites/tree-{1,2}.png (96×96).
// Sky, hills, clouds, sidewalk, road still drawn as SVG.

const SKY_TOP   = '#9cc9e6';
const SKY_MID   = '#cde4f2';
const SKY_WARM  = '#f4dfb6';
const CLOUD     = '#fbf6ea';
const CLOUD_SH  = '#dcd4be';
const HILL_FAR  = '#8aa8a0';
const HILL_NEAR = '#6e948a';

const GRASS_SH  = '#3a6342';
const GRASS_MID = '#5a9050';
const GRASS_HI  = '#8cc268';
const GRASS_TOP = '#a6d680';

const SIDEWALK   = '#c8c4b8';
const SIDEWALK_S = '#9a958a';
const ROAD       = '#3c3b38';
const ROAD_LINE  = '#f0d470';

function Cloud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const s = scale;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx={0} cy={6 * s} rx={28 * s} ry={8 * s} fill={CLOUD_SH} />
      <ellipse cx={14 * s} cy={2 * s} rx={18 * s} ry={9 * s} fill={CLOUD_SH} />
      <ellipse cx={-2} cy={2 * s} rx={30 * s} ry={9 * s} fill={CLOUD} />
      <ellipse cx={18 * s} cy={-2 * s} rx={14 * s} ry={7 * s} fill={CLOUD} />
      <ellipse cx={-16 * s} cy={0} rx={10 * s} ry={6 * s} fill={CLOUD} />
    </g>
  );
}

export default function SolarVillage() {
  return (
    <>
      <style>{`
        @keyframes cloudDrift {
          0%   { transform: translateX(0px); }
          100% { transform: translateX(30px); }
        }
        .cloud-a { animation: cloudDrift 40s ease-in-out infinite alternate; }
        .cloud-b { animation: cloudDrift 55s ease-in-out infinite alternate-reverse; }
        .village-asset { image-rendering: pixelated; }
      `}</style>

      <svg
        viewBox="0 0 1000 260"
        width="100%"
        height="260"
        style={{ display: 'block', imageRendering: 'pixelated' }}
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="svSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={SKY_TOP} />
            <stop offset="70%" stopColor={SKY_MID} />
            <stop offset="100%" stopColor={SKY_WARM} />
          </linearGradient>
          <radialGradient id="svSun" cx="0.12" cy="0.08" r="0.3">
            <stop offset="0%"  stopColor="#fff7d6" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#ffe199" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffd470" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="svGrass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={GRASS_TOP} />
            <stop offset="60%" stopColor={GRASS_HI} />
            <stop offset="100%" stopColor={GRASS_MID} />
          </linearGradient>
        </defs>

        {/* Sky + sun */}
        <rect width="1000" height="260" fill="url(#svSky)" />
        <rect width="1000" height="180" fill="url(#svSun)" />
        <circle cx={110} cy={48} r={22} fill="#fff4c0" />
        <circle cx={110} cy={48} r={14} fill="#fffbe8" />

        {/* Rolling hills */}
        <path d="M0,120 Q120,92 260,108 T520,100 T780,106 T1000,98 L1000,140 L0,140 Z" fill={HILL_FAR} opacity={0.65} />
        <path d="M0,136 Q150,110 320,124 T620,120 T900,126 T1000,122 L1000,164 L0,164 Z" fill={HILL_NEAR} opacity={0.85} />

        {/* Clouds */}
        <g className="cloud-a"><Cloud x={180} y={38} scale={1} /></g>
        <g className="cloud-b"><Cloud x={520} y={28} scale={1.3} /></g>
        <g className="cloud-a"><Cloud x={820} y={54} scale={0.9} /></g>
        <g className="cloud-b"><Cloud x={380} y={62} scale={0.7} /></g>

        {/* Lawn */}
        <rect x={0} y={160} width={1000} height={100} fill="url(#svGrass)" />
        {Array.from({ length: 80 }).map((_, i) => {
          const gx = (i * 53) % 1000;
          const gy = 170 + ((i * 37) % 60);
          return <rect key={i} x={gx} y={gy} width={2} height={1} fill={GRASS_SH} opacity={0.5} />;
        })}

        {/* Cast ground shadows under houses */}
        <ellipse cx={130} cy={224} rx={66} ry={6} fill="rgba(20,30,20,0.22)" />
        <ellipse cx={470} cy={224} rx={66} ry={6} fill="rgba(20,30,20,0.22)" />
        <ellipse cx={820} cy={224} rx={66} ry={6} fill="rgba(20,30,20,0.22)" />

        {/* Houses (128×128 sprites, scaled up to ~140×140 for presence) */}
        <image href="/sprites/house-beige.png" x={60}  y={90}  width={140} height={140} className="village-asset" preserveAspectRatio="none" />
        <image href="/sprites/house-sage.png"  x={400} y={90}  width={140} height={140} className="village-asset" preserveAspectRatio="none" />
        <image href="/sprites/house-blue.png"  x={750} y={90}  width={140} height={140} className="village-asset" preserveAspectRatio="none" />

        {/* Tree shadows */}
        <ellipse cx={260} cy={228} rx={28} ry={4} fill="rgba(20,30,20,0.28)" />
        <ellipse cx={340} cy={228} rx={22} ry={3} fill="rgba(20,30,20,0.28)" />
        <ellipse cx={610} cy={228} rx={28} ry={4} fill="rgba(20,30,20,0.28)" />
        <ellipse cx={690} cy={228} rx={22} ry={3} fill="rgba(20,30,20,0.28)" />
        <ellipse cx={940} cy={228} rx={26} ry={4} fill="rgba(20,30,20,0.28)" />

        {/* Trees between/around houses */}
        <image href="/sprites/tree-1.png" x={228} y={140} width={80} height={80} className="village-asset" preserveAspectRatio="none" />
        <image href="/sprites/tree-2.png" x={314} y={150} width={64} height={64} className="village-asset" preserveAspectRatio="none" />
        <image href="/sprites/tree-1.png" x={576} y={140} width={80} height={80} className="village-asset" preserveAspectRatio="none" />
        <image href="/sprites/tree-2.png" x={660} y={150} width={64} height={64} className="village-asset" preserveAspectRatio="none" />
        <image href="/sprites/tree-1.png" x={910} y={140} width={80} height={80} className="village-asset" preserveAspectRatio="none" />

        {/* Sidewalk */}
        <rect x={0} y={234} width={1000} height={10} fill={SIDEWALK} />
        <rect x={0} y={232} width={1000} height={2} fill={SIDEWALK_S} opacity={0.5} />
        <rect x={0} y={243} width={1000} height={1} fill={SIDEWALK_S} />
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={i * 88 + 40} y={234} width={1} height={10} fill={SIDEWALK_S} opacity={0.6} />
        ))}

        {/* Road */}
        <rect x={0} y={244} width={1000} height={16} fill={ROAD} />
        <rect x={0} y={244} width={1000} height={1} fill="#2a2927" />
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={i * 108 + 30} y={251} width={44} height={2} fill={ROAD_LINE} />
        ))}
      </svg>
    </>
  );
}
