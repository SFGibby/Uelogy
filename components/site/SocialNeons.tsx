'use client';

// Small stacked neon-rope rows for socials. Reused from the original home page's SOCIALS list.

interface Social {
  label: string;
  href: string;
  color?: string;
}

interface Props {
  socials: Social[];
  align?: 'horizontal' | 'vertical';
}

const COLORS = ['#33ff33', '#ff45c8', '#00f0ff', '#ffb13a', '#a78bfa'];

export default function SocialNeons({ socials, align = 'horizontal' }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: align === 'vertical' ? 'column' : 'row',
        gap: 8,
        flexWrap: align === 'vertical' ? 'nowrap' : 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {socials.map((s, i) => {
        const c = s.color ?? COLORS[i % COLORS.length];
        return (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 12px',
              fontFamily: 'var(--font-vt323), ui-monospace, monospace',
              fontSize: 13,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: c,
              textDecoration: 'none',
              border: `1px solid ${c}`,
              boxShadow: `0 0 8px ${c}66, inset 0 0 6px ${c}33`,
              background: 'rgba(0,0,0,0.4)',
              minHeight: 36,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {s.label}
          </a>
        );
      })}
    </div>
  );
}
