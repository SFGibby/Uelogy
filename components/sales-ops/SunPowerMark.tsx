'use client';

// SunPower wordmark lifted from the Finance Resource Guide HTML:
// SUNP + yellow sun circle + WER + superscript ®.

const SUN = '#FAD646';
const TEXT = '#ffffff';

export default function SunPowerMark({ size = 14, color = TEXT }: { size?: number; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
        fontWeight: 900,
        fontSize: size,
        letterSpacing: '0.04em',
        color,
        lineHeight: 1,
      }}
    >
      SUNP
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: `${size * 0.78}px`,
          height: `${size * 0.78}px`,
          borderRadius: '50%',
          background: SUN,
          margin: `0 ${size * 0.06}px`,
          verticalAlign: 'middle',
        }}
      />
      WER
      <sup style={{ fontSize: size * 0.4, marginLeft: 2, verticalAlign: 'super', fontWeight: 400 }}>&reg;</sup>
    </span>
  );
}
