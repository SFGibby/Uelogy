'use client';

// Pinned index cards on a side wall — "What I Do" content from the old home page.
// Mobile: horizontal swipe-snap carousel. Desktop: stacked column.

interface Card {
  title: string;
  desc: string;
}

interface Props {
  cards: Card[];
  header?: string;
}

export default function Bulletin({ cards, header = 'What I Do' }: Props) {
  return (
    <section
      style={{
        padding: '20px 0',
        color: '#e8e8e8',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-vt323), monospace',
          color: '#33ff33',
          fontSize: 13,
          letterSpacing: '0.18em',
          marginBottom: 12,
          textShadow: '0 0 6px #33ff33',
        }}
      >
        {header.toUpperCase()}
      </div>
      <div
        className="bulletin-cards"
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 8,
        }}
      >
        {cards.map((c) => (
          <article
            key={c.title}
            style={{
              flex: '0 0 80%',
              maxWidth: 320,
              minWidth: 240,
              scrollSnapAlign: 'start',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '18px 18px 16px',
            }}
          >
            <div
              style={{
                width: 28,
                height: 2,
                background: 'rgba(51,255,51,0.5)',
                borderRadius: 2,
                marginBottom: 14,
              }}
            />
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#fff',
                margin: '0 0 6px',
              }}
            >
              {c.title}
            </h3>
            <p
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {c.desc}
            </p>
          </article>
        ))}
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .bulletin-cards {
            flex-direction: column;
            overflow: visible;
            scroll-snap-type: none;
          }
          .bulletin-cards > article {
            flex: 1 1 auto;
            max-width: none;
          }
        }
      `}</style>
    </section>
  );
}
