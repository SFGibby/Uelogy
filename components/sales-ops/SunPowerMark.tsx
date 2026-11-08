'use client';

import Image from 'next/image';

// Real SunPower wordmark, extracted from the official EPS. White letters,
// yellow sun ring on the O, registered mark.
// Aspect: ~723x120 (6.025:1). Height is the input dimension; width scales.

export default function SunPowerMark({ height = 18, compact = false }: { height?: number; compact?: boolean }) {
  if (compact) {
    const size = Math.max(22, Math.round(height * 1.25));
    return (
      <span aria-label="SunPower" style={{ display: 'inline-flex', alignItems: 'center' }}>
        <svg width={size} height={size} viewBox="0 0 32 32" role="img">
          <title>SunPower</title>
          {/* The O in SUNPOWER: a clean yellow ring, nothing else. */}
          <circle cx="16" cy="16" r="10" fill="none" stroke="#FAD646" strokeWidth="3.4" />
        </svg>
      </span>
    );
  }
  const width = Math.round(height * 6.025);
  return (
    <Image
      src="/sales-ops/sunpower-logo@2x.png"
      alt="SunPower"
      width={width}
      height={height}
      priority
      style={{ display: 'block', height: `${height}px`, width: `${width}px` }}
    />
  );
}
