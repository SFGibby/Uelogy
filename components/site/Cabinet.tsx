'use client';

// Generic arcade cabinet primitive. Variant determines the skin.
// Pure presentation; the parent decides what clicking does (open modal, navigate, etc.).

type Variant =
  | 'grid'        // Tron cyan
  | 'ledger'      // carved wood + leaded glass + ivy + brass key
  | 'learning'    // chalkboard + brass
  | 'collection'  // gallery display case
  | 'tetris'      // classic black with falling-block decal
  | 'triage'      // gunmetal grey + SunPower navy bleed
  | 'covered';    // draped plastic, decorative

interface Props {
  label: string;
  variant: Variant;
  sublabel?: string;
  locked?: boolean;
  href?: string;
  onClick?: () => void;
}

const SKINS: Record<
  Variant,
  { accent: string; bg: string; border: string; marquee: string; deco?: React.ReactNode }
> = {
  grid: {
    accent: '#00f0ff',
    bg: 'linear-gradient(180deg, #0c1418 0%, #050a0d 100%)',
    border: '#00f0ff',
    marquee: '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
  },
  ledger: {
    accent: '#b8932e',
    bg: 'linear-gradient(180deg, #3a2810 0%, #1a1208 100%)',
    border: '#7a5a2a',
    marquee: '"Cardo", Georgia, serif',
  },
  learning: {
    accent: '#e3b465',
    bg: 'linear-gradient(180deg, #2a3324 0%, #131a10 100%)',
    border: '#5e4b2e',
    marquee: 'Georgia, "Iowan Old Style", serif',
  },
  collection: {
    accent: '#a78bfa',
    bg: 'linear-gradient(180deg, #1a1322 0%, #0c081a 100%)',
    border: '#7c3aed',
    marquee: 'Georgia, serif',
  },
  tetris: {
    accent: '#33ff33',
    bg: 'linear-gradient(180deg, #0c0c10 0%, #050507 100%)',
    border: '#33ff33',
    marquee: 'var(--font-vt323), monospace',
  },
  triage: {
    accent: '#3a82d1',
    bg: 'linear-gradient(180deg, #18202c 0%, #0a0d14 100%)',
    border: '#3a4a64',
    marquee: 'system-ui, sans-serif',
  },
  covered: {
    accent: '#7a7a7a',
    bg: 'linear-gradient(180deg, rgba(140,140,140,0.18) 0%, rgba(60,60,60,0.18) 100%)',
    border: 'rgba(180,180,180,0.18)',
    marquee: 'system-ui, sans-serif',
  },
};

export default function Cabinet({
  label,
  variant,
  sublabel,
  locked,
  href,
  onClick,
}: Props) {
  const s = SKINS[variant];
  const inner = (
    <div
      style={{
        width: '100%',
        maxWidth: 380,
        margin: '0 auto',
        position: 'relative',
        background: s.bg,
        border: `2px solid ${s.border}`,
        borderRadius: 12,
        padding: '20px 18px 22px',
        boxShadow:
          variant === 'covered'
            ? 'inset 0 0 24px rgba(0,0,0,0.4)'
            : `0 0 22px ${s.accent}44, inset 0 0 18px ${s.accent}1a`,
        color: s.accent,
        fontFamily: s.marquee,
        textAlign: 'center',
        cursor: variant === 'covered' ? 'default' : 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Marquee label */}
      <div
        style={{
          fontSize: variant === 'covered' ? 14 : 22,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          textShadow:
            variant === 'covered' ? 'none' : `0 0 6px ${s.accent}`,
          fontWeight: variant === 'tetris' ? 400 : 700,
        }}
      >
        {label}
      </div>

      {/* CRT screen */}
      <div
        aria-hidden
        style={{
          flex: 1,
          minHeight: 92,
          background: '#000',
          border: `1px solid ${s.accent}55`,
          boxShadow: `inset 0 0 12px ${s.accent}44`,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          letterSpacing: '0.36em',
          color: `${s.accent}aa`,
          padding: 8,
          textAlign: 'center',
        }}
      >
        {locked ? '🔒 PASSWORD' : sublabel ?? '▶ PLAY'}
      </div>

      {/* Controls bay */}
      <div
        aria-hidden
        style={{
          height: 22,
          background: 'linear-gradient(180deg, #1a1f23 0%, #0c1014 100%)',
          border: `1px solid ${s.accent}33`,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 14px',
        }}
      >
        <span style={{ width: 6, height: 6, background: s.accent, borderRadius: '50%' }} />
        <span style={{ width: 6, height: 6, background: '#ff5050', borderRadius: '50%' }} />
        <span style={{ width: 18, height: 4, background: s.accent, opacity: 0.7 }} />
      </div>
    </div>
  );

  if (variant === 'covered') {
    return (
      <div aria-hidden style={{ width: '100%', opacity: 0.7 }}>
        {inner}
      </div>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        aria-label={label}
        style={{ display: 'block', textDecoration: 'none' }}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        width: '100%',
        cursor: 'pointer',
      }}
    >
      {inner}
    </button>
  );
}
