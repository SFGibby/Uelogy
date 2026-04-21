import Link from 'next/link';

interface Entry {
  id: string;
  role: string;
  name: string;
  email?: string;
  scope: string;
  category: 'escalation' | 'support';
}

const ENTRIES: Entry[] = [
  {
    id: 'sales-ops',
    role: 'Sales Operations',
    name: 'Samuel Gibson',
    email: 'samuel.gibson@sunpower.com',
    scope:
      'Urgent mid-appointment escalations. Catch-all for ambiguous routing during prototype.',
    category: 'escalation',
  },
  {
    id: 'direct-sales-mgr',
    role: 'Direct Sales Manager',
    name: '[TBD]',
    scope:
      'Post-sale issues from SunPower direct sales channel. In-house reps & their pipeline.',
    category: 'escalation',
  },
  {
    id: 'epc-mgr',
    role: 'EPC / Field Sales Manager',
    name: '[TBD]',
    scope:
      'Post-sale issues from partnered EPCs and installers selling under the SunPower umbrella.',
    category: 'escalation',
  },
  {
    id: 'pip-owner',
    role: 'Preferred Installer Program (PIP) Owner',
    name: '[TBD]',
    scope: 'PIP enrollment, tier changes, partner standing.',
    category: 'escalation',
  },
  {
    id: 'tech-support',
    role: 'Tech Support',
    name: '[TBD]',
    scope:
      'System outages, CRM errors, proposal-tool issues, customer portal access problems.',
    category: 'support',
  },
  {
    id: 'onboarding',
    role: 'Onboarding (new employee)',
    name: '[TBD]',
    scope:
      'Day-one HR, equipment, badges, training schedule for non-sales roles.',
    category: 'support',
  },
  {
    id: 'sales-onboarding',
    role: 'Sales Onboarding (new rep ramp)',
    name: '[TBD]',
    scope:
      'First-90-days sales training, CRM setup for reps, territory assignment.',
    category: 'support',
  },
  {
    id: 'commissions',
    role: 'Commissions',
    name: '[TBD]',
    scope:
      'Pay questions, dispute process, payout schedule, deal attribution.',
    category: 'support',
  },
];

export default function DirectoryPage() {
  const escalations = ENTRIES.filter((e) => e.category === 'escalation');
  const support = ENTRIES.filter((e) => e.category === 'support');

  return (
    <main>
      <section style={{ position: 'relative', padding: '56px 0 32px', overflow: 'hidden' }}>
        <div className="sp-mesh" />
        <div className="sp-grid" />
        <div className="sp-container">
          <div className="sp-eyebrow">Triage · Directory</div>
          <h1 className="sp-h1" style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
            Who owns what.
          </h1>
          <p className="sp-lead">
            The router lane reads this file. Anchor links like{' '}
            <code style={codeStyle}>/triage/directory#commissions</code> jump straight to
            the entry.
          </p>
        </div>
      </section>

      <section className="sp-section" style={{ paddingTop: 8 }}>
        <div className="sp-container">
          <SectionBlock title="Escalation targets" entries={escalations} />
          <SectionBlock title="Support functions" entries={support} />

          <div
            className="sp-card"
            style={{ padding: 20, marginTop: 16, borderStyle: 'dashed' }}
          >
            <div className="sp-eyebrow">Placeholder data</div>
            <p className="sp-body" style={{ marginTop: 6 }}>
              All{' '}
              <code style={codeStyle}>[TBD]</code> entries escalate to Sam during
              prototype. Update{' '}
              <code style={codeStyle}>app/triage/directory.md</code> once owners are
              assigned.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionBlock({ title, entries }: { title: string; entries: Entry[] }) {
  return (
    <div style={{ marginBottom: 44 }}>
      <h2 className="sp-h2" style={{ fontSize: 24, marginBottom: 16 }}>
        {title}
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 14,
        }}
      >
        {entries.map((e) => {
          const assigned = e.name !== '[TBD]';
          return (
            <div
              key={e.id}
              id={e.id}
              className="sp-card"
              style={{
                padding: 20,
                scrollMarginTop: 90,
                borderLeft: `3px solid ${assigned ? 'var(--sp-blue)' : 'var(--sp-ink-4)'}`,
              }}
            >
              <div className="sp-eyebrow" style={{ fontSize: 11 }}>
                {e.role}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  marginTop: 6,
                  color: assigned ? 'var(--sp-text-hi)' : 'var(--sp-text-lo)',
                }}
              >
                {e.name}
              </div>
              {e.email && (
                <Link
                  href={`mailto:${e.email}`}
                  style={{
                    display: 'inline-block',
                    fontSize: 13,
                    color: 'var(--sp-blue-soft)',
                    marginTop: 4,
                    textDecoration: 'none',
                  }}
                >
                  {e.email}
                </Link>
              )}
              <p className="sp-body" style={{ marginTop: 10 }}>
                {e.scope}
              </p>
              <Link
                href={`#${e.id}`}
                style={{
                  display: 'inline-block',
                  marginTop: 10,
                  fontSize: 11,
                  color: 'var(--sp-text-lo)',
                  textDecoration: 'none',
                  letterSpacing: '0.05em',
                }}
              >
                # {e.id}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
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
