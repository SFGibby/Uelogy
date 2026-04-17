'use client';

// Solar village — Sea of Stars-style scene composed from PixelLab tiles.
// Stack (top→bottom):
//   y=0..110   sky-hills.png   (parallax backdrop, scaled from 400×128)
//   y=110..150 grass-tile.png  (SVG pattern tiled horizontally)
//   y=150..180 sidewalk-tile.png (pattern)
//   y=180..220 road-tile.png   (pattern)
// Clouds drift across the sky. Houses and trees overlay the grass line.

export default function SolarVillage() {
  return (
    <>
      <style>{`
        @keyframes sv_cloudA {
          0%   { transform: translateX(0px); }
          100% { transform: translateX(40px); }
        }
        @keyframes sv_cloudB {
          0%   { transform: translateX(0px); }
          100% { transform: translateX(-30px); }
        }
        .sv-cloud-a { animation: sv_cloudA 42s ease-in-out infinite alternate; }
        .sv-cloud-b { animation: sv_cloudB 58s ease-in-out infinite alternate; }
      `}</style>

      <svg
        viewBox="0 0 400 220"
        width="100%"
        style={{ display: 'block', imageRendering: 'pixelated' }}
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="crispEdges"
      >
        <defs>
          <pattern id="sv-grass" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
            <image href="/sprites/grass-tile.png" x="0" y="0" width="64" height="64" />
          </pattern>
          <pattern id="sv-sidewalk" x="0" y="0" width="128" height="48" patternUnits="userSpaceOnUse">
            <image href="/sprites/sidewalk-tile.png" x="0" y="0" width="128" height="48" />
          </pattern>
          <pattern id="sv-road" x="0" y="0" width="128" height="64" patternUnits="userSpaceOnUse">
            <image href="/sprites/road-tile.png" x="0" y="0" width="128" height="64" />
          </pattern>
        </defs>

        {/* Sky + distant hills backdrop */}
        <image
          href="/sprites/sky-hills.png"
          x={0} y={0} width={400} height={110}
          preserveAspectRatio="none"
        />

        {/* Clouds drifting in the upper sky */}
        <g className="sv-cloud-a">
          <image href="/sprites/cloud-1.png" x={40}  y={18} width={56} height={28} />
        </g>
        <g className="sv-cloud-b">
          <image href="/sprites/cloud-2.png" x={220} y={10} width={56} height={28} />
        </g>
        <g className="sv-cloud-a">
          <image href="/sprites/cloud-1.png" x={310} y={30} width={48} height={24} />
        </g>

        {/* Grass strip */}
        <rect x={0} y={108} width={400} height={44} fill="url(#sv-grass)" />

        {/* Sidewalk */}
        <rect x={0} y={152} width={400} height={28} fill="url(#sv-sidewalk)" />

        {/* Road */}
        <rect x={0} y={180} width={400} height={40} fill="url(#sv-road)" />

        {/* Houses — bottom on grass/sidewalk line at y=152 */}
        {/* House is 80 tall scaled from 128, so y = 152 - 80 = 72 */}
        <image href="/sprites/house-beige.png" x={24}  y={72} width={80} height={80} />
        <image href="/sprites/house-sage.png"  x={152} y={72} width={80} height={80} />
        <image href="/sprites/house-blue.png"  x={280} y={72} width={80} height={80} />

        {/* Trees in the gaps — bottom on the same grass line */}
        <image href="/sprites/tree-1.png" x={108} y={100} width={44} height={52} />
        <image href="/sprites/tree-2.png" x={238} y={104} width={40} height={48} />
        <image href="/sprites/tree-1.png" x={362} y={102} width={38} height={50} />
      </svg>
    </>
  );
}
