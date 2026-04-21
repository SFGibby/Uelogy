import Link from 'next/link';

interface QA {
  id: string;
  q: string;
  a: string;
  tag?: string;
}

const SECTIONS: { title: string; qa: QA[] }[] = [
  {
    title: 'Product & warranty',
    qa: [
      {
        id: 'warranty-panels',
        q: 'What are the warranty terms on SunPower panels?',
        a: '25-year product + performance warranty on panels. 25-year warranty on SunPower-branded microinverters. 10-year warranty on third-party string inverters we resell.',
      },
      {
        id: 'equinox-generator',
        q: 'Does the Equinox system work with an existing generator?',
        a: 'Yes, via a transfer switch. Generator must be single-phase, 240V. Only the hybrid inverter side supports it.',
      },
      {
        id: 'site-survey',
        q: 'Can we skip the site survey?',
        a: "No. Every install requires one. Customer can schedule same-week in most territories.",
      },
    ],
  },
  {
    title: 'Deal stage & objections',
    qa: [
      {
        id: 'in-home-pitch',
        q: "Customer is wavering mid-pitch — what's the one-line reframe?",
        a: "Default: confirm their biggest concern, mirror it back, then answer with one specific product fact. Don't list features. If they're stuck on price, offer the closing-visit financing recap.",
      },
      {
        id: 'signing-blocked',
        q: 'Signature is blocked by a technical question I can\'t answer.',
        a: "Use the In-Appointment lane on the Triage bot. If the bot can't answer confidently, Sam is paged immediately. Keep the customer engaged while waiting.",
      },
    ],
  },
  {
    title: 'Channels',
    qa: [
      {
        id: 'direct-vs-epc',
        q: 'Direct sales vs. EPC — what\'s the channel split?',
        a: "Direct = SunPower-branded installs sold by in-house reps. EPC/Field = sold under SunPower umbrella by partnered Engineering, Procurement & Construction firms and installers. PIP = Preferred Installer Program, separate partner tier with its own ops contact.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <main>
      <section style={{ position: 'relative', padding: '56px 0 32px', overflow: 'hidden' }}>
        <div className="sp-mesh" />
        <div className="sp-grid" />
        <div className="sp-container">
          <div className="sp-eyebrow">Triage · FAQ</div>
          <h1 className="sp-h1" style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
            Frequently asked,
            <br />
            <span style={{ color: 'var(--sp-blue-soft)' }}>finally organized.</span>
          </h1>
          <p className="sp-lead">
            Links are anchor-safe. The bot hands you a URL like{' '}
            <code style={codeStyle}>/triage/faq#warranty-panels</code> and you land right on the answer.
          </p>
        </div>
      </section>

      <section className="sp-section" style={{ paddingTop: 8 }}>
        <div className="sp-container">
          {SECTIONS.map((s) => (
            <div key={s.title} style={{ marginBottom: 44 }}>
              <h2 className="sp-h2" style={{ fontSize: 24, marginBottom: 16 }}>
                {s.title}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {s.qa.map((qa) => (
                  <details
                    key={qa.id}
                    id={qa.id}
                    className="sp-card"
                    style={{ padding: '18px 20px', scrollMarginTop: 90 }}
                  >
                    <summary
                      style={{
                        cursor: 'pointer',
                        fontSize: 16,
                        fontWeight: 600,
                        color: 'var(--sp-text-hi)',
                        listStyle: 'none',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 12,
                      }}
                    >
                      <span style={{ color: 'var(--sp-blue)', fontSize: 14 }}>◆</span>
                      <span>{qa.q}</span>
                    </summary>
                    <p
                      className="sp-body"
                      style={{ marginTop: 12, marginBottom: 4, paddingLeft: 26 }}
                    >
                      {qa.a}
                    </p>
                    <div style={{ paddingLeft: 26, marginTop: 8 }}>
                      <Link
                        href={`#${qa.id}`}
                        style={{
                          fontSize: 12,
                          color: 'var(--sp-text-lo)',
                          textDecoration: 'none',
                          letterSpacing: '0.05em',
                        }}
                      >
                        # {qa.id}
                      </Link>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}

          <div
            className="sp-card"
            style={{ padding: 20, marginTop: 16, borderStyle: 'dashed' }}
          >
            <div className="sp-eyebrow">Prototype</div>
            <p className="sp-body" style={{ marginTop: 6 }}>
              These entries are scaffolding. Add real SunPower Q&amp;As to{' '}
              <code style={codeStyle}>app/triage/knowledge-base.md</code> and they&apos;ll flow
              into the bot immediately. This page will be regenerated once real content lands.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

const codeStyle: React.CSSProperties = {
  background: 'var(--sp-ink-2)',
  border: '1px solid var(--sp-ink-3)',
  padding: '2px 7px',
  borderRadius: 5,
  fontSize: 13,
  color: 'var(--sp-blue-soft)',
};
