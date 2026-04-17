'use client';

// Solar village — fully composed from PixelLab-generated PNGs.
// street-bg.png (400×200): sky, hills, clouds, lawn, sidewalk, road
// house-{beige,sage,blue}.png (128×128): solar-roofed suburban homes
// tree-{1,2}.png (96×96): deciduous + pine
//
// In street-bg.png, the grass/sidewalk boundary sits at approximately y=140.
// Houses and trees are placed so their bottoms land on that boundary.

const GROUND_Y = 140;

export default function SolarVillage() {
  const houseH = 96;
  const houseW = 96;
  const houseY = GROUND_Y - houseH;

  const treeH = 56;
  const treeW = 44;
  const treeY = GROUND_Y - treeH;

  return (
    <svg
      viewBox="0 0 400 200"
      width="100%"
      style={{ display: 'block', imageRendering: 'pixelated' }}
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="crispEdges"
    >
      <image
        href="/sprites/street-bg.png"
        x={0} y={0} width={400} height={200}
        preserveAspectRatio="none"
        style={{ imageRendering: 'pixelated' }}
      />

      <image href="/sprites/house-beige.png" x={26}  y={houseY} width={houseW} height={houseH} style={{ imageRendering: 'pixelated' }} />
      <image href="/sprites/house-sage.png"  x={152} y={houseY} width={houseW} height={houseH} style={{ imageRendering: 'pixelated' }} />
      <image href="/sprites/house-blue.png"  x={278} y={houseY} width={houseW} height={houseH} style={{ imageRendering: 'pixelated' }} />

      <image href="/sprites/tree-1.png" x={120} y={treeY + 8} width={treeW} height={treeH} style={{ imageRendering: 'pixelated' }} />
      <image href="/sprites/tree-2.png" x={242} y={treeY + 4} width={38}   height={50}    style={{ imageRendering: 'pixelated' }} />
      <image href="/sprites/tree-1.png" x={370} y={treeY + 8} width={treeW - 4} height={treeH - 2} style={{ imageRendering: 'pixelated' }} />
    </svg>
  );
}
