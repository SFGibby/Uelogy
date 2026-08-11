// Reframes "What I Do" as a framed OPERATOR'S LICENSE hanging on the arcade wall.
// Content unchanged — same {title, desc} cards, quieter treatment below the fold.

export interface LicenseCard {
  title: string;
  desc: string;
}

export interface OperatorsLicenseProps {
  cards: LicenseCard[];
  name?: string;
  issued?: string;
}

export default function OperatorsLicense({
  cards,
  name = 'SAMUEL GIBSON',
  issued = '2012',
}: OperatorsLicenseProps) {
  return (
    <section
      aria-label="Operator's license"
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '18px',
        background:
          'linear-gradient(180deg, #1a1408 0%, #100a04 100%)',
        border: '6px solid #6a4a1a',
        borderRadius: 4,
        boxShadow:
          'inset 0 0 30px rgba(0,0,0,0.7), 0 12px 24px -8px rgba(0,0,0,0.7), 0 0 0 1px #2a1a08',
      }}
    >
      <div
        style={{
          padding: '18px 20px 20px',
          background: '#f3e8c8',
          color: '#2a1a08',
          border: '1px solid #b48a3a',
          borderRadius: 2,
          boxShadow: 'inset 0 0 12px rgba(120,80,20,0.15)',
          fontFamily: 'var(--font-vt323), ui-monospace, monospace',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderBottom: '1px dashed #b48a3a',
            paddingBottom: 8,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-press-start), monospace',
              fontSize: 11,
              letterSpacing: '0.24em',
              color: '#7a5010',
            }}
          >
            OPERATOR&apos;S LICENSE
          </div>
          <div style={{ fontSize: 13, letterSpacing: '0.12em', color: '#5a3a10' }}>
            ISSUED · {issued}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 22, letterSpacing: '0.08em', color: '#1a1004' }}>
            {name}
          </div>
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.2em',
              color: '#7a5010',
              padding: '2px 8px',
              border: '1px solid #7a5010',
              borderRadius: 2,
            }}
          >
            CLASS · A
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gap: 10,
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}
        >
          {cards.map((c) => (
            <div
              key={c.title}
              style={{
                padding: '8px 10px',
                background: '#e8d8a8',
                borderLeft: '3px solid #7a5010',
                fontSize: 14,
                lineHeight: 1.35,
                color: '#2a1a08',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-press-start), monospace',
                  fontSize: 9,
                  letterSpacing: '0.18em',
                  color: '#7a5010',
                  marginBottom: 4,
                }}
              >
                {c.title.toUpperCase()}
              </div>
              {c.desc}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 14,
            paddingTop: 10,
            borderTop: '1px dashed #b48a3a',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            letterSpacing: '0.14em',
            color: '#7a5010',
          }}
        >
          <span>SIG · s. gibson</span>
          <span>SEAL · {String(cards.length).padStart(2, '0')} ENDORSEMENTS</span>
        </div>
      </div>
    </section>
  );
}
