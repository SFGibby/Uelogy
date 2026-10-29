'use client';

import Image from 'next/image';

// Real SunPower wordmark, extracted from the official EPS. White letters,
// yellow sun ring on the O, registered mark.
// Aspect: ~723x120 (6.025:1). Height is the input dimension; width scales.

export default function SunPowerMark({ height = 18 }: { height?: number }) {
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
