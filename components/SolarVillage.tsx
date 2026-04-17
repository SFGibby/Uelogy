'use client';

// Sea of Stars style pixel art neighborhood with solar panels
// viewBox 900×180, all coordinates multiples of 4 for pixel-perfect look

const SKY_TOP = '#080e1c';
const SKY_BOT = '#10213a';
const ROOF    = '#1c2e50';
const ROOF_HL = '#243a62'; // eave / lighter row
const SOLAR   = '#0e2240';
const SOLAR_L = '#1a3456'; // panel highlight line color
const WIN     = '#ffb830';
const WIN_GLO = '#ff920020';
const DOOR    = '#180c02';
const WALL_A  = '#5a4230';
const WALL_B  = '#4e3828';
const WALL_SH = '#3a2818'; // shadow side
const CHIMNEY = '#3a2e1e';
const TRUNK   = '#4a2e0e';
const LEAF_1  = '#265438';
const LEAF_2  = '#2e6440';
const LEAF_3  = '#387848';
const LEAF_4  = '#4a8c58';
const LEAF_5  = '#5aa068';
const GRASS   = '#1e4228';
const EARTH   = '#141e12';
const KNOB    = '#8b6914';

// Stars: [cx, cy, r, twinkleDuration, twinkleDelay]
const STARS: [number, number, number, string, string][] = [
  [14, 10, 1.5, '3.2s', '0s'],   [34, 4,  1,   '2.8s', '1.4s'],
  [52, 16, 2,   '4.0s', '0.6s'], [76, 6,  1.5, '3.6s', '2.1s'],
  [100, 3, 1,   '2.4s', '0.3s'], [124, 13, 2,  '3.8s', '1.8s'],
  [152, 5, 1.5, '3.0s', '0.9s'], [180, 9, 1,   '4.2s', '2.6s'],
  [208, 3, 2,   '2.6s', '0.4s'], [224, 14, 1.5,'3.4s', '1.0s'],
  [550, 7, 1.5, '3.1s', '0.7s'], [572, 3, 1,   '3.7s', '2.3s'],
  [598, 12, 2,  '2.9s', '1.5s'], [624, 5, 1.5, '4.1s', '0.1s'],
  [652, 9, 1,   '3.3s', '2.8s'], [678, 3, 2,   '2.7s', '1.1s'],
  [704, 14, 1.5,'3.9s', '0.5s'], [728, 6, 1,   '3.5s', '1.9s'],
  [756, 3, 2,   '4.3s', '0.8s'], [780, 11, 1.5,'2.5s', '2.4s'],
  [808, 5, 1,   '3.2s', '1.6s'], [832, 13, 2,  '3.8s', '0.2s'],
  [858, 3, 1.5, '2.9s', '3.0s'], [880, 9, 1,   '4.0s', '1.3s'],
  [896, 15, 2,  '3.4s', '2.7s'],
];

// Solar panel helper — draws a panel array with subtle grid lines
function Panel({ x, y, w, h }: { x:number; y:number; w:number; h:number }) {
  const lines = [];
  // Horizontal dividers every 8px
  for (let ly = y + 8; ly < y + h; ly += 8) {
    lines.push(<line key={`h${ly}`} x1={x} y1={ly} x2={x+w} y2={ly} stroke={SOLAR_L} strokeWidth={0.5} />);
  }
  // Vertical dividers every 12px
  for (let lx = x + 12; lx < x + w; lx += 12) {
    lines.push(<line key={`v${lx}`} x1={lx} y1={y} x2={lx} y2={y+h} stroke={SOLAR_L} strokeWidth={0.5} />);
  }
  return (
    <>
      <rect x={x} y={y} width={w} height={h} fill={SOLAR} />
      {lines}
    </>
  );
}

// Glowing window
function Win({ x, y, w=20, h=20 }: { x:number; y:number; w?:number; h?:number }) {
  return (
    <>
      <rect x={x-4} y={y-4} width={w+8} height={h+8} fill={WIN_GLO} />
      <rect x={x} y={y} width={w} height={h} fill={WIN} />
      {/* reflection glint */}
      <rect x={x} y={y} width={4} height={4} fill="#ffe4a0" opacity={0.7} />
    </>
  );
}

// Pixel art tree
function Tree({ x, y }: { x:number; y:number }) {
  return (
    <>
      <rect x={x+4} y={y+20} width={8} height={28} fill={TRUNK} />
      <rect x={x}    y={y+16} width={16} height={8} fill={LEAF_2} />
      <rect x={x-4}  y={y+8}  width={24} height={8} fill={LEAF_2} />
      <rect x={x-8}  y={y}    width={32} height={8} fill={LEAF_3} />
      <rect x={x-4}  y={y-8}  width={24} height={8} fill={LEAF_4} />
      <rect x={x}    y={y-16} width={16} height={8} fill={LEAF_4} />
      <rect x={x+4}  y={y-24} width={8}  height={8} fill={LEAF_5} />
    </>
  );
}

// Small tree
function SmallTree({ x, y }: { x:number; y:number }) {
  return (
    <>
      <rect x={x+4} y={y+12} width={8} height={20} fill={TRUNK} />
      <rect x={x}    y={y+8}  width={16} height={8} fill={LEAF_2} />
      <rect x={x-4}  y={y}    width={24} height={8} fill={LEAF_3} />
      <rect x={x}    y={y-8}  width={16} height={8} fill={LEAF_4} />
      <rect x={x+4}  y={y-16} width={8}  height={8} fill={LEAF_5} />
    </>
  );
}

export default function SolarVillage() {
  return (
    <>
      <style>{`
        @keyframes villageTwinkle {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
        @keyframes panelGlint {
          0%, 85%, 100% { opacity: 0; }
          92%            { opacity: 0.7; }
        }
        .star-twinkle { animation: villageTwinkle ease-in-out infinite; }
        .panel-glint  { animation: panelGlint 6s ease-in-out infinite; }
      `}</style>

      <svg
        viewBox="0 0 900 180"
        width="100%"
        height="180"
        style={{ display: 'block', imageRendering: 'pixelated' }}
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="villSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SKY_TOP} />
            <stop offset="100%" stopColor={SKY_BOT} />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="900" height="180" fill="url(#villSky)" />

        {/* Stars */}
        {STARS.map(([cx, cy, r, dur, delay], i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="#d4e8f8"
            className="star-twinkle"
            style={{ animationDuration: dur, animationDelay: delay }}
          />
        ))}

        {/* Crescent moon */}
        <circle cx={856} cy={34} r={24} fill="#c8dff0" />
        <circle cx={870} cy={28} r={18} fill={SKY_TOP} />

        {/* Ground */}
        <rect x={0} y={148} width={900} height={12} fill={GRASS} />
        <rect x={0} y={160} width={900} height={20} fill={EARTH} />

        {/* ── HOUSE A (left cottage) ── */}
        {/* chimney */}
        <rect x={116} y={56} width={12} height={32} fill={CHIMNEY} />
        {/* roof staircase */}
        <rect x={96}  y={68} width={52} height={12} fill={ROOF} />
        <rect x={80}  y={80} width={84} height={12} fill={ROOF} />
        <Panel x={84} y={80} w={76} h={12} />
        <rect x={68}  y={92} width={108} height={12} fill={ROOF_HL} />
        {/* wall */}
        <rect x={72}  y={104} width={100} height={68} fill={WALL_A} />
        <rect x={72}  y={104} width={12}  height={68} fill={WALL_SH} />
        {/* windows */}
        <Win x={84}  y={116} />
        <Win x={132} y={116} />
        {/* door */}
        <rect x={110} y={132} width={18} height={40} fill={DOOR} />
        <rect x={124} y={151} width={4}  height={4}  fill={KNOB} />
        {/* panel glint accent */}
        <rect x={84}  y={80} width={76} height={4} fill="#4a6a90" className="panel-glint" opacity={0} />

        {/* ── TREE B ── */}
        <Tree x={192} y={112} />

        {/* ── HOUSE B (large center) ── */}
        {/* chimneys */}
        <rect x={284} y={40} width={12} height={40} fill={CHIMNEY} />
        <rect x={356} y={48} width={12} height={32} fill={CHIMNEY} />
        {/* roof staircase (4 rows) */}
        <rect x={272} y={52} width={88}  height={12} fill={ROOF} />
        <rect x={252} y={64} width={128} height={12} fill={ROOF} />
        <Panel x={260} y={64} w={112} h={12} />
        <rect x={236} y={76} width={160} height={12} fill={ROOF} />
        <Panel x={244} y={76} w={144} h={12} />
        <rect x={224} y={88} width={184} height={12} fill={ROOF_HL} />
        {/* wall */}
        <rect x={228} y={100} width={176} height={72} fill={WALL_B} />
        <rect x={228} y={100} width={12}  height={72} fill={WALL_SH} />
        {/* windows × 3 */}
        <Win x={244} y={112} w={24} h={24} />
        <Win x={296} y={112} w={24} h={24} />
        <Win x={356} y={112} w={24} h={24} />
        {/* door */}
        <rect x={298} y={132} width={20} height={40} fill={DOOR} />
        <rect x={314} y={151} width={4}  height={4}  fill={KNOB} />
        {/* panel glint */}
        <rect x={260} y={64} width={112} height={4} fill="#4a6a90" className="panel-glint"
              style={{ animationDelay: '2s' }} opacity={0} />
        <rect x={244} y={76} width={144} height={4} fill="#4a6a90" className="panel-glint"
              style={{ animationDelay: '3.5s' }} opacity={0} />

        {/* ── TREE C ── */}
        <Tree x={452} y={116} />

        {/* ── HOUSE C (medium right) ── */}
        {/* chimney */}
        <rect x={552} y={52} width={12} height={32} fill={CHIMNEY} />
        {/* roof staircase */}
        <rect x={512} y={64} width={76}  height={12} fill={ROOF} />
        <Panel x={520} y={64} w={60} h={12} />
        <rect x={496} y={76} width={108} height={12} fill={ROOF} />
        <Panel x={504} y={76} w={92} h={12} />
        <rect x={484} y={88} width={132} height={12} fill={ROOF_HL} />
        {/* wall */}
        <rect x={488} y={100} width={124} height={72} fill={WALL_A} />
        <rect x={488} y={100} width={12}  height={72} fill={WALL_SH} />
        {/* windows */}
        <Win x={500} y={112} />
        <Win x={556} y={112} />
        {/* door */}
        <rect x={534} y={128} width={16} height={44} fill={DOOR} />
        <rect x={546} y={151} width={4}  height={4}  fill={KNOB} />
        {/* panel glint */}
        <rect x={520} y={64} width={60} height={4} fill="#4a6a90" className="panel-glint"
              style={{ animationDelay: '1.2s' }} opacity={0} />

        {/* ── TREE D ── */}
        <SmallTree x={648} y={116} />

        {/* ── HOUSE D (far right small) ── */}
        {/* chimney */}
        <rect x={740} y={60} width={12} height={28} fill={CHIMNEY} />
        {/* roof staircase */}
        <rect x={704} y={72} width={76} height={12} fill={ROOF} />
        <Panel x={712} y={72} w={60} h={12} />
        <rect x={692} y={84} width={100} height={12} fill={ROOF_HL} />
        {/* wall */}
        <rect x={696} y={96} width={92}  height={76} fill={WALL_A} />
        <rect x={696} y={96} width={12}  height={76} fill={WALL_SH} />
        {/* windows */}
        <Win x={708} y={108} />
        <Win x={752} y={108} />
        {/* door */}
        <rect x={732} y={124} width={16} height={48} fill={DOOR} />
        <rect x={744} y={151} width={4}  height={4}  fill={KNOB} />
        {/* panel glint */}
        <rect x={712} y={72} width={60} height={4} fill="#4a6a90" className="panel-glint"
              style={{ animationDelay: '4s' }} opacity={0} />

        {/* ── TREE E (far right) ── */}
        <Tree x={820} y={112} />

        {/* Foreground grass bump detail */}
        <rect x={0}   y={145} width={900} height={4} fill={LEAF_1} opacity={0.4} />

      </svg>
    </>
  );
}
