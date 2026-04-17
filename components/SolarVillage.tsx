'use client';

// Solar village — hybrid top-down SoS-style composition.
// Thin treeline strip at top, then a continuous grass plane with houses
// planted in it (cast shadows + flanking bushes + driveways binding them
// to the sidewalk/road at the bottom).

const CONCRETE     = '#c8c4b8';
const CONCRETE_SH  = '#9a958a';

// House placement — all three on the same base line at y=172 (sidewalk top)
const HOUSE_SIZE = 96;
const HOUSE_BASE_Y = 172;
const HOUSE_Y = HOUSE_BASE_Y - HOUSE_SIZE;
const HOUSES: { x: number; href: string }[] = [
  { x: 18,  href: '/sprites/house-beige.png' },
  { x: 152, href: '/sprites/house-sage.png'  },
  { x: 286, href: '/sprites/house-blue.png'  },
];

function Driveway({ x }: { x: number }) {
  // Driveway extends from house base down through sidewalk to road edge
  const dx = x + HOUSE_SIZE - 26;
  const dy = HOUSE_BASE_Y - 8;
  const dw = 18;
  const dh = 26;
  return (
    <g>
      <rect x={dx} y={dy} width={dw} height={dh} fill={CONCRETE} />
      <rect x={dx} y={dy} width={dw} height={2} fill={CONCRETE_SH} opacity={0.45} />
      <rect x={dx} y={dy + dh - 2} width={dw} height={2} fill={CONCRETE_SH} opacity={0.5} />
      <rect x={dx + dw / 2} y={dy} width={1} height={dh} fill={CONCRETE_SH} opacity={0.4} />
    </g>
  );
}

function HouseGroup({ x, href }: { x: number; href: string }) {
  const cx = x + HOUSE_SIZE / 2;
  return (
    <>
      {/* Soft cast shadow under the house */}
      <ellipse
        cx={cx}
        cy={HOUSE_BASE_Y - 4}
        rx={HOUSE_SIZE / 2.2}
        ry={5}
        fill="#000"
        opacity={0.35}
      />
      <image
        href={href}
        x={x}
        y={HOUSE_Y}
        width={HOUSE_SIZE}
        height={HOUSE_SIZE}
        preserveAspectRatio="none"
      />
      {/* Flanking bushes — bottom-left corner and bottom-right corner */}
      <image
        href="/sprites/bush-1.png"
        x={x - 6}
        y={HOUSE_BASE_Y - 22}
        width={22}
        height={22}
      />
      <image
        href="/sprites/bush-2.png"
        x={x + HOUSE_SIZE - 18}
        y={HOUSE_BASE_Y - 24}
        width={24}
        height={24}
      />
    </>
  );
}

export default function SolarVillage() {
  return (
    <>
      <style>{`
        @keyframes sv_cloudA { 0% { transform: translateX(0); } 100% { transform: translateX(40px); } }
        @keyframes sv_cloudB { 0% { transform: translateX(0); } 100% { transform: translateX(-28px); } }
        .sv-cloud-a { animation: sv_cloudA 48s ease-in-out infinite alternate; }
        .sv-cloud-b { animation: sv_cloudB 62s ease-in-out infinite alternate; }
      `}</style>

      <svg
        viewBox="0 0 400 220"
        width="100%"
        style={{ display: 'block', imageRendering: 'pixelated' }}
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="crispEdges"
      >
        <defs>
          {/* Bottom portion of sky-hills used as a thin treeline strip */}
          <clipPath id="sv-sky-clip">
            <rect x={0} y={0} width={400} height={32} />
          </clipPath>
          <pattern id="sv-grass" x={0} y={0} width={128} height={128} patternUnits="userSpaceOnUse">
            <image href="/sprites/grass-td.png" x={0} y={0} width={128} height={128} />
          </pattern>
          <pattern id="sv-sidewalk" x={0} y={0} width={128} height={64} patternUnits="userSpaceOnUse">
            <image href="/sprites/sidewalk-td.png" x={0} y={0} width={128} height={64} />
          </pattern>
          <pattern id="sv-road" x={0} y={0} width={128} height={64} patternUnits="userSpaceOnUse">
            <image href="/sprites/road-td.png" x={0} y={0} width={128} height={64} />
          </pattern>
        </defs>

        {/* Sky / treeline trim at very top (bottom slice of sky-hills.png) */}
        <g clipPath="url(#sv-sky-clip)">
          <image href="/sprites/sky-hills.png" x={0} y={-96} width={400} height={128} preserveAspectRatio="none" />
        </g>

        {/* Drifting clouds just below the treeline */}
        <g className="sv-cloud-a">
          <image href="/sprites/cloud-1.png" x={50}  y={2}  width={48} height={20} opacity={0.85} />
        </g>
        <g className="sv-cloud-b">
          <image href="/sprites/cloud-2.png" x={240} y={4}  width={48} height={20} opacity={0.85} />
        </g>

        {/* Main grass plane */}
        <rect x={0} y={32} width={400} height={140} fill="url(#sv-grass)" />

        {/* Sidewalk strip */}
        <rect x={0} y={172} width={400} height={20} fill="url(#sv-sidewalk)" />

        {/* Road strip */}
        <rect x={0} y={192} width={400} height={28} fill="url(#sv-road)" />

        {/* Driveways — drawn on top of sidewalk/road so they bridge to curb */}
        {HOUSES.map(h => <Driveway key={h.x} x={h.x} />)}

        {/* Houses (with shadow + bushes, rendered top-down) */}
        {HOUSES.map(h => <HouseGroup key={h.href} x={h.x} href={h.href} />)}

        {/* Trees filling the gaps between houses — grounded at y=172 */}
        <image href="/sprites/tree-1.png" x={112} y={126} width={38} height={46} />
        <image href="/sprites/tree-2.png" x={246} y={130} width={36} height={42} />
        <image href="/sprites/tree-1.png" x={370} y={128} width={30} height={44} />

        {/* Extra scattered bushes for ground variation */}
        <image href="/sprites/bush-1.png" x={4}   y={154} width={18} height={18} />
        <image href="/sprites/bush-2.png" x={132} y={156} width={18} height={18} />
        <image href="/sprites/bush-1.png" x={268} y={154} width={18} height={18} />
        <image href="/sprites/bush-2.png" x={384} y={156} width={14} height={14} />
      </svg>
    </>
  );
}
