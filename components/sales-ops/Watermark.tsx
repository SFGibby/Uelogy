'use client';

import { useEffect, useState } from 'react';

/**
 * Full-screen tiled watermark. Pulls the viewer's name + unlock time from
 * the sales_ops_identity cookie and renders a tiled semi-transparent SVG
 * repeat so any screenshot of a /sales-ops surface carries attribution.
 *
 * Opacity is low enough to stay out of the way on screen but survives a
 * compressed screenshot upload.
 */
export default function Watermark() {
  const [identity, setIdentity] = useState<{ name: string; when: string } | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const raw = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('sales_ops_identity='));
    if (!raw) return;
    try {
      const value = decodeURIComponent(raw.slice('sales_ops_identity='.length));
      const parsed = JSON.parse(value) as { name?: string; when?: string };
      if (parsed.name && parsed.when) {
        setIdentity({ name: parsed.name, when: parsed.when });
      }
    } catch { /* ignore malformed cookies */ }
  }, []);

  if (!identity) return null;

  // Format the unlock time once per render; the live clock changes the
  // watermark payload if we ever want to re-render on an interval.
  const label = `${identity.name} \u00b7 ${new Date(identity.when).toISOString().slice(0, 16).replace('T', ' ')} UTC`;

  // Build the SVG tile. Rotate -22deg for an off-axis repeat that reads
  // instantly as "watermark" rather than UI copy.
  const tile = `
    <svg xmlns='http://www.w3.org/2000/svg' width='520' height='260' viewBox='0 0 520 260'>
      <text x='0' y='140' fill='rgba(255,255,255,0.06)'
            font-family='var(--font-gibson-mono), monospace'
            font-size='18' letter-spacing='3' transform='rotate(-22 260 130)'>
        ${label.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </text>
    </svg>`.trim();

  const url = `data:image/svg+xml;utf8,${encodeURIComponent(tile)}`;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: `url("${url}")`,
        backgroundRepeat: 'repeat',
        mixBlendMode: 'overlay',
        zIndex: 70,
      }}
    />
  );
}
