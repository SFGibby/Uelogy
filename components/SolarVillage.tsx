'use client';

// Pre-rendered Stardew-style solar cottage village.
// Source tiles: Sprout Lands by Cup Nooble (non-commercial license, credited in CREDITS.md).
// Composition script: scripts/compose-village.py

export default function SolarVillage() {
  return (
    <img
      src="/sprites/village-scene.png"
      alt="Solar cottage village"
      style={{
        display: 'block',
        width: '100%',
        height: 'auto',
        imageRendering: 'pixelated',
      }}
    />
  );
}
