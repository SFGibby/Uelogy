import Link from 'next/link';

interface Card {
  id: string;
  title: string;
  body: string;
  tag: string;
}

const CARDS: Card[] = [
  {
    id: 'warranty-snapshot',
    tag: 'Warranty',
    title: '25 / 25 / 10',
    body:
      'Panels: 25-year product + performance. SunPower microinverters: 25-year. Third-party string inverters: 10-year.',
  },
  {
    id: 'install-prereqs',
    tag: 'Install',
    title: 'Site survey is non-negotiable',
    body:
      'Every install requires one. Same-week scheduling in most territories. Do not promise skip.',
  },
  {
    id: 'generator-support',
    tag: 'Equinox',
    title: 'Generator + transfer switch',
    body:
      'Single-phase, 240V generators only. Hybrid inverter side only. Verify before promising compatibility.',
  },
  {
    id: 'channel-split',
    tag: 'Channel',
    title: 'Direct vs EPC vs PIP',
    body:
      'Direct = in-house SunPower reps. EPC = partner installers under SunPower umbrella. PIP = Preferred Installer Program (separate tier, separate owner).',
  },
  {
    id: 'urgency-rubric',
    tag: 'Triage',
    title: 'What actually counts as URGENT',
    body:
      'Customer threatening to walk. Signature blocked right now. Safety/code/legal risk. Post-install outage. Everything else is NORMAL or LOW.',
  },
  {
    id: 'pledge-rule',
    tag: 'Triage',
    title: 'The In-Appointment pledge',
    body:
      'Picking the "In Appointment!!!" lane requires a one-tap confirmation that the customer is in the room. Abuse gets flagged and future requests de-prioritized.',
  },
];

export default function ReferencePage() {
  return (
    <main>
      <section style={{ position: 'relative', padding: '56px 0 32px', overflow: 'hidden' }}>
        <div className="sp-mesh" />
        <div className="sp-grid" />
        <div className="sp-container">
          <div className="sp-eyebrow">Triage · Reference</div>
          <h1 className="sp-h1" style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
            Cheatsheet,
            <br />
            <span style={{ color: 'var(--sp-blue-soft)' }}>not a textbook.</span>
          </h1>
          <p className="sp-lead">
            The stuff reps forget mid-appointment. Each card is anchor-linkable so the
            bot can point you at the exact one.
          </p>
        </div>
      </section>

      <section className="sp-section" style={{ paddingTop: 8 }}>
        <div className="sp-container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            {CARDS.map((c) => (
              <div
                key={c.id}
                id={c.id}
                className="sp-card"
                style={{ padding: 22, scrollMarginTop: 90 }}
              >
                <span className="sp-badge sp-badge-blue">{c.tag}</span>
                <h3
                  className="sp-h3"
                  style={{ fontSize: 22, marginTop: 14, marginBottom: 10 }}
                >
                  {c.title}
                </h3>
                <p className="sp-body" style={{ margin: 0 }}>
                  {c.body}
                </p>
                <Link
                  href={`#${c.id}`}
                  style={{
                    display: 'inline-block',
                    marginTop: 12,
                    fontSize: 11,
                    color: 'var(--sp-text-lo)',
                    textDecoration: 'none',
                    letterSpacing: '0.05em',
                  }}
                >
                  # {c.id}
                </Link>
              </div>
            ))}
          </div>

          <div
            className="sp-card"
            style={{ padding: 20, marginTop: 20, borderStyle: 'dashed' }}
          >
            <div className="sp-eyebrow">Prototype</div>
            <p className="sp-body" style={{ marginTop: 6 }}>
              Six scaffold cards only. Add or remove as the knowledge base evolves.
              Long-term this page should be generated from the same source the bot reads.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
