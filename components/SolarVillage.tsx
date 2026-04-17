'use client';

// Solar village — fully composed from PixelLab-generated PNGs.
// street-bg.png (400×200): sky, hills, clouds, lawn, sidewalk, road
// house-{beige,sage,blue}.png (128×128): solar-roofed suburban homes
// tree-{1,2}.png (96×96): deciduous + pine
//
// Houses and trees overlay the bg at y values chosen so their base pixels
// sit on the lawn line (≈y=165 in the 200-tall bg).

export default function SolarVillage() {
  return (
    <svg
      viewBox="0 0 400 200"
      width="100%"
      style={{ display: 'block', imageRendering: 'pixelated' }}
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
    >
      {/* Background scene — sky, hills, grass, sidewalk, road baked in */}
      <image
        href="/sprites/street-bg.png"
        x={0} y={0} width={400} height={200}
        preserveAspectRatio="none"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Houses — bottom of each PNG aligned with grass/sidewalk transition */}
      <image href="/sprites/house-beige.png" x={26}  y={74} width={96} height={96} style={{ imageRendering: 'pixelated' }} />
      <image href="/sprites/house-sage.png"  x={152} y={74} width={96} height={96} style={{ imageRendering: 'pixelated' }} />
      <image href="/sprites/house-blue.png"  x={278} y={74} width={96} height={96} style={{ imageRendering: 'pixelated' }} />

      {/* Trees between houses — grounded on the lawn */}
      <image href="/sprites/tree-1.png" x={116} y={112} width={44} height={56} style={{ imageRendering: 'pixelated' }} />
      <image href="/sprites/tree-2.png" x={240} y={118} width={38} height={50} style={{ imageRendering: 'pixelated' }} />
      <image href="/sprites/tree-1.png" x={368} y={112} width={40} height={52} style={{ imageRendering: 'pixelated' }} />
    </svg>
  );
}
