'use client';

// Sea of Stars inspired daytime suburban neighborhood with solar panels.
// viewBox 1000×260. Pastel-blue sky + warm horizon, distant hills, 3 modern houses
// with pitched solar roofs, lawns, driveways, sidewalk, road. Multi-tone shading.

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
const DRIVEWAY   = '#7c7a74';
const DRIVEWAY_S = '#545350';
const ROAD       = '#3c3b38';
const ROAD_LINE  = '#f0d470';

const WOOD_TRUNK = '#5a3422';
const WOOD_TRUNK_S = '#341e10';

// Foliage ramps (dark→light)
const LEAF_1 = '#224a28';
const LEAF_2 = '#316a3a';
const LEAF_3 = '#488c4e';
const LEAF_4 = '#6cb064';
const LEAF_5 = '#96d082';

// Solar panels
const SOLAR    = '#132646';
const SOLAR_HI = '#2a4a74';
const SOLAR_LN = '#0a1530';

// Window
const WIN_GLASS = '#bde0ec';
const WIN_HI    = '#eef6fa';
const WIN_SH    = '#5e8ca2';
const WIN_FRAME = '#f2ecd8';
const WIN_FRAME_S = '#b8ab88';

const DOOR_WOOD  = '#7a3a22';
const DOOR_WOOD_S = '#4a1f10';
const DOOR_KNOB  = '#e8c060';

// Cloud helper — layered ovals
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

// Solar panel array — rendered on the pitched roof, slightly angled
function SolarArray({
  x, y, w, h, angleSkew = 0,
}: { x: number; y: number; w: number; h: number; angleSkew?: number }) {
  const cellW = 12;
  const cellH = 8;
  const cells = [];
  for (let ry = 0; ry < h; ry += cellH) {
    for (let rx = 0; rx < w; rx += cellW) {
      cells.push(
        <rect
          key={`${rx}-${ry}`}
          x={rx}
          y={ry}
          width={cellW - 1}
          height={cellH - 1}
          fill={SOLAR}
          stroke={SOLAR_HI}
          strokeWidth={0.5}
        />
      );
    }
  }
  // subtle reflective sheen overlay
  return (
    <g transform={`translate(${x}, ${y}) skewX(${angleSkew})`}>
      <rect x={-1} y={-1} width={w + 2} height={h + 2} fill={SOLAR_LN} />
      {cells}
      <rect x={2} y={2} width={w * 0.35} height={2} fill={SOLAR_HI} opacity={0.6} />
    </g>
  );
}

// Window with frame + mullions
function Window({ x, y, w = 22, h = 26 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* frame */}
      <rect x={-2} y={-2} width={w + 4} height={h + 4} fill={WIN_FRAME_S} />
      <rect x={-1} y={-1} width={w + 2} height={h + 2} fill={WIN_FRAME} />
      {/* glass */}
      <rect x={0} y={0} width={w} height={h} fill={WIN_GLASS} />
      {/* reflection */}
      <rect x={0} y={0} width={w * 0.45} height={h * 0.55} fill={WIN_HI} opacity={0.6} />
      {/* mullions */}
      <rect x={w / 2 - 0.5} y={0} width={1} height={h} fill={WIN_FRAME_S} />
      <rect x={0} y={h / 2 - 0.5} width={w} height={1} fill={WIN_FRAME_S} />
      {/* sill */}
      <rect x={-3} y={h + 2} width={w + 6} height={2} fill={WIN_FRAME_S} />
    </g>
  );
}

// Suburban house — 3/4 perspective: front wall + roof slab visible from above
// Left side has a subtle depth shadow
function House({
  x, y, wall, wallSh, roof, roofHi, roofSh,
  door = DOOR_WOOD, hasGarage = true, w = 260, wallH = 92,
}: {
  x: number; y: number;
  wall: string; wallSh: string;
  roof: string; roofHi: string; roofSh: string;
  door?: string; hasGarage?: boolean;
  w?: number; wallH?: number;
}) {
  const roofPeakH = 28;
  const roofOverhang = 8;
  // Roof is a trapezoid showing pitch (wider at front/bottom, narrower at peak)
  const roofTopY = y;
  const roofBottomY = y + roofPeakH;
  const roofLeft = x - roofOverhang;
  const roofRight = x + w + roofOverhang;
  const peakInset = 48;
  const wallX = x;
  const wallY = roofBottomY;

  return (
    <g>
      {/* cast ground shadow */}
      <ellipse cx={x + w / 2} cy={wallY + wallH + 4} rx={w / 2 + 6} ry={6} fill="rgba(20,30,20,0.18)" />

      {/* Roof — trapezoid (front pitched slab) */}
      <polygon
        points={`
          ${roofLeft + peakInset},${roofTopY}
          ${roofRight - peakInset},${roofTopY}
          ${roofRight},${roofBottomY}
          ${roofLeft},${roofBottomY}
        `}
        fill={roof}
      />
      {/* roof highlight strip near peak */}
      <polygon
        points={`
          ${roofLeft + peakInset + 4},${roofTopY + 2}
          ${roofRight - peakInset - 4},${roofTopY + 2}
          ${roofRight - peakInset - 8},${roofTopY + 6}
          ${roofLeft + peakInset + 8},${roofTopY + 6}
        `}
        fill={roofHi}
      />
      {/* roof shadow strip near bottom edge (eave) */}
      <polygon
        points={`
          ${roofLeft},${roofBottomY - 3}
          ${roofRight},${roofBottomY - 3}
          ${roofRight},${roofBottomY}
          ${roofLeft},${roofBottomY}
        `}
        fill={roofSh}
      />
      {/* fascia board along eave */}
      <rect x={roofLeft} y={roofBottomY} width={roofRight - roofLeft} height={3} fill={roofSh} />

      {/* Solar panel array on the roof — skewed slightly to match pitch */}
      <SolarArray
        x={roofLeft + peakInset + 14}
        y={roofTopY + 6}
        w={(roofRight - roofLeft) - 2 * (peakInset + 14)}
        h={roofPeakH - 12}
      />

      {/* Front wall */}
      <rect x={wallX} y={wallY} width={w} height={wallH} fill={wall} />
      {/* left edge subtle shadow (3/4 depth hint) */}
      <rect x={wallX} y={wallY} width={5} height={wallH} fill={wallSh} opacity={0.7} />
      {/* horizontal siding lines */}
      {[14, 28, 42, 56, 70, 84].map((oy, i) => (
        <rect key={i} x={wallX} y={wallY + oy} width={w} height={1} fill={wallSh} opacity={0.35} />
      ))}
      {/* foundation strip */}
      <rect x={wallX - 2} y={wallY + wallH - 6} width={w + 4} height={6} fill={wallSh} />

      {/* Windows */}
      <Window x={wallX + 24} y={wallY + 24} />
      {!hasGarage && <Window x={wallX + w - 46} y={wallY + 24} />}

      {/* Door */}
      {(() => {
        const doorW = 22;
        const doorH = 44;
        const doorX = wallX + (hasGarage ? 70 : Math.round(w / 2) - 11);
        const doorY = wallY + wallH - doorH - 4;
        return (
          <g>
            {/* door frame */}
            <rect x={doorX - 2} y={doorY - 2} width={doorW + 4} height={doorH + 4} fill={WIN_FRAME_S} />
            <rect x={doorX - 1} y={doorY - 1} width={doorW + 2} height={doorH + 2} fill={WIN_FRAME} />
            {/* door */}
            <rect x={doorX} y={doorY} width={doorW} height={doorH} fill={door} />
            <rect x={doorX} y={doorY} width={doorW} height={3} fill={DOOR_WOOD_S} opacity={0.4} />
            <rect x={doorX + doorW - 2} y={doorY} width={2} height={doorH} fill={DOOR_WOOD_S} opacity={0.5} />
            {/* small window in door */}
            <rect x={doorX + 4} y={doorY + 6} width={doorW - 8} height={10} fill={WIN_GLASS} />
            <rect x={doorX + 4} y={doorY + 6} width={(doorW - 8) * 0.5} height={5} fill={WIN_HI} opacity={0.6} />
            {/* knob */}
            <circle cx={doorX + doorW - 4} cy={doorY + doorH / 2 + 4} r={1.4} fill={DOOR_KNOB} />
            {/* step */}
            <rect x={doorX - 6} y={doorY + doorH} width={doorW + 12} height={3} fill={SIDEWALK} />
            <rect x={doorX - 6} y={doorY + doorH + 3} width={doorW + 12} height={2} fill={SIDEWALK_S} />
          </g>
        );
      })()}

      {/* Garage door (right side) */}
      {hasGarage && (() => {
        const gW = 70;
        const gH = 54;
        const gX = wallX + w - gW - 14;
        const gY = wallY + wallH - gH - 4;
        return (
          <g>
            <rect x={gX - 2} y={gY - 2} width={gW + 4} height={gH + 4} fill={WIN_FRAME_S} />
            <rect x={gX - 1} y={gY - 1} width={gW + 2} height={gH + 2} fill={WIN_FRAME} />
            <rect x={gX} y={gY} width={gW} height={gH} fill="#d8d2c0" />
            {/* garage horizontal panels */}
            {[10, 22, 34, 46].map((oy, i) => (
              <rect key={i} x={gX} y={gY + oy} width={gW} height={1.5} fill="#a8a088" />
            ))}
            {/* panel column dividers */}
            {[gW * 0.25, gW * 0.5, gW * 0.75].map((ox, i) => (
              <rect key={i} x={gX + ox} y={gY} width={1} height={gH} fill="#a8a088" opacity={0.5} />
            ))}
            {/* top trim shadow */}
            <rect x={gX} y={gY} width={gW} height={2} fill="#a8a088" />
          </g>
        );
      })()}
    </g>
  );
}

// Driveway in front of a house (leading to the garage)
function Driveway({ x, y, w = 80, h = 28 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={DRIVEWAY} />
      <rect x={x} y={y} width={w} height={2} fill={DRIVEWAY_S} opacity={0.5} />
      <rect x={x} y={y + h - 2} width={w} height={2} fill={DRIVEWAY_S} />
      {/* seam */}
      <rect x={x + w / 2} y={y} width={1} height={h} fill={DRIVEWAY_S} opacity={0.5} />
    </g>
  );
}

// Layered deciduous tree — multiple foliage tones
function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const s = scale;
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* cast shadow */}
      <ellipse cx={0} cy={44 * s} rx={26 * s} ry={5 * s} fill="rgba(20,30,20,0.3)" />
      {/* trunk */}
      <rect x={-4 * s} y={26 * s} width={8 * s} height={18 * s} fill={WOOD_TRUNK} />
      <rect x={-4 * s} y={26 * s} width={3 * s} height={18 * s} fill={WOOD_TRUNK_S} />
      {/* foliage — large back layer */}
      <ellipse cx={0} cy={6 * s} rx={30 * s} ry={24 * s} fill={LEAF_1} />
      <ellipse cx={-8 * s} cy={0} rx={20 * s} ry={18 * s} fill={LEAF_2} />
      <ellipse cx={8 * s} cy={4 * s} rx={18 * s} ry={16 * s} fill={LEAF_2} />
      {/* mid layer */}
      <ellipse cx={-4 * s} cy={-2 * s} rx={18 * s} ry={15 * s} fill={LEAF_3} />
      <ellipse cx={10 * s} cy={-4 * s} rx={14 * s} ry={12 * s} fill={LEAF_3} />
      {/* highlights */}
      <ellipse cx={-6 * s} cy={-6 * s} rx={10 * s} ry={8 * s} fill={LEAF_4} />
      <ellipse cx={6 * s} cy={-8 * s} rx={8 * s} ry={7 * s} fill={LEAF_4} />
      {/* top speck highlight */}
      <ellipse cx={-2 * s} cy={-10 * s} rx={5 * s} ry={4 * s} fill={LEAF_5} />
    </g>
  );
}

// Small bush
function Bush({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx={0} cy={2} rx={12} ry={8} fill={LEAF_1} />
      <ellipse cx={-3} cy={-1} rx={10} ry={7} fill={LEAF_3} />
      <ellipse cx={2} cy={-3} rx={6} ry={5} fill={LEAF_4} />
    </g>
  );
}

// Mailbox — simple post + box
function Mailbox({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx={0} cy={18} rx={8} ry={2} fill="rgba(20,30,20,0.25)" />
      <rect x={-1} y={0} width={2} height={18} fill={WOOD_TRUNK_S} />
      <rect x={-6} y={-6} width={12} height={7} fill="#4a4e58" />
      <rect x={-6} y={-6} width={12} height={2} fill="#2a2e38" />
      <rect x={4} y={-3} width={2} height={3} fill="#d02020" /> {/* flag */}
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
        @keyframes panelGlint {
          0%, 88%, 100% { opacity: 0; }
          94%            { opacity: 0.8; }
        }
        .cloud-a { animation: cloudDrift 40s ease-in-out infinite alternate; }
        .cloud-b { animation: cloudDrift 55s ease-in-out infinite alternate-reverse; }
      `}</style>

      <svg
        viewBox="0 0 1000 260"
        width="100%"
        height="260"
        style={{ display: 'block', imageRendering: 'pixelated' }}
        preserveAspectRatio="xMidYMax slice"
        shapeRendering="crispEdges"
      >
        <defs>
          <linearGradient id="dlySky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={SKY_TOP} />
            <stop offset="70%" stopColor={SKY_MID} />
            <stop offset="100%" stopColor={SKY_WARM} />
          </linearGradient>
          <radialGradient id="dlySun" cx="0.12" cy="0.08" r="0.3">
            <stop offset="0%"  stopColor="#fff7d6" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#ffe199" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffd470" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="dlyGrass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={GRASS_TOP} />
            <stop offset="60%" stopColor={GRASS_HI} />
            <stop offset="100%" stopColor={GRASS_MID} />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="1000" height="260" fill="url(#dlySky)" />
        {/* Sun glow */}
        <rect width="1000" height="180" fill="url(#dlySun)" />
        {/* Sun disc */}
        <circle cx={110} cy={48} r={22} fill="#fff4c0" />
        <circle cx={110} cy={48} r={14} fill="#fffbe8" />

        {/* Distant far hills */}
        <path d="M0,120 Q120,92 260,108 T520,100 T780,106 T1000,98 L1000,140 L0,140 Z" fill={HILL_FAR} opacity={0.65} />
        {/* Nearer hills */}
        <path d="M0,136 Q150,110 320,124 T620,120 T900,126 T1000,122 L1000,164 L0,164 Z" fill={HILL_NEAR} opacity={0.85} />

        {/* Clouds */}
        <g className="cloud-a"><Cloud x={180} y={38} scale={1} /></g>
        <g className="cloud-b"><Cloud x={520} y={28} scale={1.3} /></g>
        <g className="cloud-a"><Cloud x={820} y={54} scale={0.9} /></g>
        <g className="cloud-b"><Cloud x={380} y={62} scale={0.7} /></g>

        {/* Lawn / ground — fills area behind houses */}
        <rect x={0} y={160} width={1000} height={100} fill="url(#dlyGrass)" />
        {/* grass texture flecks */}
        {Array.from({ length: 80 }).map((_, i) => {
          const gx = (i * 53) % 1000;
          const gy = 170 + ((i * 37) % 60);
          return <rect key={i} x={gx} y={gy} width={2} height={1} fill={GRASS_SH} opacity={0.5} />;
        })}

        {/* HOUSE 1 — beige/cream with dark slate roof */}
        <House
          x={60} y={118}
          wall="#ead5ad" wallSh="#b68c5c"
          roof="#4a5260" roofHi="#6a7280" roofSh="#2a3038"
          door="#8a2e20"
          hasGarage
        />
        <Driveway x={230} y={210} w={74} h={30} />

        {/* Tree between 1 and 2 */}
        <Tree x={352} y={176} scale={0.95} />

        {/* HOUSE 2 — sage green with dark roof */}
        <House
          x={400} y={110}
          wall="#c8d3a0" wallSh="#7e9460"
          roof="#3e4a3c" roofHi="#5c6a58" roofSh="#202820"
          door="#3a5a78"
          hasGarage
          w={260} wallH={100}
        />
        <Driveway x={570} y={218} w={74} h={26} />

        {/* Tree between 2 and 3 */}
        <Tree x={700} y={176} scale={0.85} />

        {/* HOUSE 3 — blue-grey with terracotta accents */}
        <House
          x={740} y={126}
          wall="#bac5cd" wallSh="#6a7c8a"
          roof="#704038" roofHi="#9a5c48" roofSh="#3e1e18"
          door="#e0b864"
          hasGarage
          w={220} wallH={86}
        />
        <Driveway x={900} y={216} w={60} h={28} />

        {/* Bushes in yards */}
        <Bush x={128} y={214} />
        <Bush x={160} y={216} />
        <Bush x={468} y={214} />
        <Bush x={500} y={216} />
        <Bush x={780} y={216} />
        <Bush x={808} y={218} />

        {/* Mailboxes at yard edges */}
        <Mailbox x={36} y={214} />
        <Mailbox x={380} y={214} />
        <Mailbox x={720} y={218} />

        {/* Sidewalk */}
        <rect x={0} y={234} width={1000} height={10} fill={SIDEWALK} />
        <rect x={0} y={232} width={1000} height={2} fill={SIDEWALK_S} opacity={0.5} />
        <rect x={0} y={243} width={1000} height={1} fill={SIDEWALK_S} />
        {/* sidewalk seams */}
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={i * 88 + 40} y={234} width={1} height={10} fill={SIDEWALK_S} opacity={0.6} />
        ))}

        {/* Road */}
        <rect x={0} y={244} width={1000} height={16} fill={ROAD} />
        <rect x={0} y={244} width={1000} height={1} fill="#2a2927" />
        {/* road dashes */}
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={i * 108 + 30} y={251} width={44} height={2} fill={ROAD_LINE} />
        ))}

        {/* Subtle foreground grass tufts on sidewalk edge */}
        {[80, 220, 340, 480, 600, 740, 880].map((gx, i) => (
          <g key={i}>
            <rect x={gx} y={232} width={6} height={2} fill={GRASS_HI} />
            <rect x={gx + 2} y={230} width={2} height={2} fill={LEAF_4} />
          </g>
        ))}
      </svg>
    </>
  );
}
