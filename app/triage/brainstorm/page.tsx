'use client';
import { useEffect, useState } from 'react';

type Submission = {
  id: string;
  department: string;
  parent_company: string | null;
  head_name: string | null;
  head_role: string | null;
  purpose: string;
  owns: string;
  does_not_own: string | null;
  top_questions: string;
  systems: string[];
  handoff_partners: string | null;
  gray_areas: string | null;
  contact_sla: string | null;
  created_at: string;
};

type Report = {
  id: string;
  submission_count: number;
  overlaps_markdown: string;
  gaps_markdown: string;
  recommendations_markdown: string;
  created_at: string;
};

const CRUCIAL_DEPARTMENTS = [
  'Install Operations (Blue Raven)',
  'Third-Party EPC Coordination',
  'PIP Program Management',
  'Credit & Finance Ops',
  'Design & Engineering (Enerflo)',
  'Customer Care / Post-Sale',
  'Commissions & Pay',
  'Field Sales Enablement',
];

const PARENT_COMPANIES = [
  'SunPower',
  'Blue Raven Solar',
  'Complete Solar',
  'Solaria',
  'Ambia',
  'Sunder',
  'Other',
];

const SYSTEMS = [
  'Enerflo',
  'Customer Portal',
  'Installer Portal',
  'Salesforce',
  'Jira / ServiceNow',
  'Slack',
  'Internal Tools',
];

const FAKE_ORG = [
  { parent: 'SunPower (corporate)', children: ['Revenue Ops', 'Finance', 'Legal', 'IT & Business Systems'] },
  { parent: 'Blue Raven Solar', children: ['Install Operations', 'Customer Care', 'Field Sales'] },
  { parent: 'Complete Solar', children: ['EPC Partner Mgmt', 'Design & Engineering'] },
  { parent: 'Solaria / Ambia / Sunder', children: ['PIP Program', 'Credit & Finance Ops', 'Commissions'] },
];

export default function BrainStormPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [latestReport, setLatestReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [department, setDepartment] = useState(CRUCIAL_DEPARTMENTS[0]);
  const [customDept, setCustomDept] = useState('');
  const [parentCompany, setParentCompany] = useState('SunPower');
  const [headName, setHeadName] = useState('');
  const [headRole, setHeadRole] = useState('');
  const [purpose, setPurpose] = useState('');
  const [owns, setOwns] = useState('');
  const [doesNotOwn, setDoesNotOwn] = useState('');
  const [topQuestions, setTopQuestions] = useState('');
  const [systems, setSystems] = useState<string[]>([]);
  const [handoffPartners, setHandoffPartners] = useState('');
  const [grayAreas, setGrayAreas] = useState('');
  const [contactSla, setContactSla] = useState('');
  const [submittedByEmail, setSubmittedByEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/triage/brainstorm/list');
      const data = await res.json();
      if (res.ok) {
        setSubmissions(data.submissions ?? []);
        setLatestReport(data.latestReport ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleSystem(s: string) {
    setSystems((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const deptFinal = department === '__custom' ? customDept.trim() : department;
    if (!deptFinal || !purpose.trim() || !owns.trim() || !topQuestions.trim()) {
      setSubmitError('Department, purpose, owns, and top questions are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/triage/brainstorm/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          department: deptFinal,
          parentCompany,
          headName,
          headRole,
          purpose,
          owns,
          doesNotOwn,
          topQuestions,
          systems,
          handoffPartners,
          grayAreas,
          contactSla,
          submittedByEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'submit failed');
      setPurpose('');
      setOwns('');
      setDoesNotOwn('');
      setTopQuestions('');
      setSystems([]);
      setHandoffPartners('');
      setGrayAreas('');
      setContactSla('');
      setHeadName('');
      setHeadRole('');
      setSubmittedByEmail('');
      setCustomDept('');
      setFormOpen(false);
      await refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function runReport() {
    setReporting(true);
    setReportError(null);
    try {
      const res = await fetch('/api/triage/brainstorm/report', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'report failed');
      setLatestReport(data.report);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'report failed');
    } finally {
      setReporting(false);
    }
  }

  return (
    <main style={{ position: 'relative' }}>
      <div className="sp-mesh" />
      <div className="sp-grid" />
      <div className="sp-container" style={{ paddingTop: 32, paddingBottom: 80 }}>
        <div className="sp-eyebrow">Internal · Sales Support</div>
        <h1 className="sp-h1" style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
          Brain Storm.
        </h1>
        <p className="sp-lead" style={{ maxWidth: 720 }}>
          A working surface for drawing clean lines between departments inside a merged-company
          org. Each department head submits a scope snapshot; the button at the bottom runs an
          overlap analysis so we can see where ownership is muddy before we encode it into the
          Helios brain.
        </p>

        <Section title="1. The lesson — how to build a brain that actually routes">
          <BrainLesson />
        </Section>

        <Section title="2. The org map (working draft)">
          <OrgMap />
          <p className="sp-body" style={{ marginTop: 12, maxWidth: 680 }}>
            Placeholder for now. Replace with the real chart once you get it. Only visible here
            inside Brain Storm — not on any public page.
          </p>
        </Section>

        <Section title="3. Department scope submissions">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
            <div className="sp-body">
              {loading ? 'Loading…' : `${submissions.length} submission${submissions.length === 1 ? '' : 's'} so far.`}
            </div>
            <button
              className="sp-btn"
              onClick={() => setFormOpen((v) => !v)}
              type="button"
            >
              {formOpen ? 'Close form' : 'Add a submission'}
            </button>
          </div>

          {formOpen && (
            <SubmissionForm
              department={department}
              setDepartment={setDepartment}
              customDept={customDept}
              setCustomDept={setCustomDept}
              parentCompany={parentCompany}
              setParentCompany={setParentCompany}
              headName={headName}
              setHeadName={setHeadName}
              headRole={headRole}
              setHeadRole={setHeadRole}
              purpose={purpose}
              setPurpose={setPurpose}
              owns={owns}
              setOwns={setOwns}
              doesNotOwn={doesNotOwn}
              setDoesNotOwn={setDoesNotOwn}
              topQuestions={topQuestions}
              setTopQuestions={setTopQuestions}
              systems={systems}
              toggleSystem={toggleSystem}
              handoffPartners={handoffPartners}
              setHandoffPartners={setHandoffPartners}
              grayAreas={grayAreas}
              setGrayAreas={setGrayAreas}
              contactSla={contactSla}
              setContactSla={setContactSla}
              submittedByEmail={submittedByEmail}
              setSubmittedByEmail={setSubmittedByEmail}
              onSubmit={submitForm}
              submitting={submitting}
              submitError={submitError}
            />
          )}

          <SubmissionsList submissions={submissions} />
        </Section>

        <Section title="4. Run overlap report">
          <p className="sp-body" style={{ maxWidth: 680, marginBottom: 16 }}>
            Reads every submission, finds where departments claim the same work, calls out gaps,
            and proposes line-in-the-sand ownership. Takes ~20 seconds. Needs at least two
            submissions.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="sp-btn"
              onClick={runReport}
              disabled={reporting || submissions.length < 2}
              type="button"
              style={{
                opacity: reporting || submissions.length < 2 ? 0.5 : 1,
                cursor: reporting || submissions.length < 2 ? 'not-allowed' : 'pointer',
              }}
            >
              {reporting ? 'Analyzing…' : 'Run overlap report'}
            </button>
            {submissions.length < 2 && (
              <span className="sp-body" style={{ fontSize: 13 }}>
                Need at least 2 submissions.
              </span>
            )}
            {reportError && (
              <span style={{ color: 'var(--sp-danger)', fontSize: 13 }}>{reportError}</span>
            )}
          </div>

          {latestReport && <ReportView report={latestReport} />}
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 56 }}>
      <h2 className="sp-h2" style={{ fontSize: 'clamp(22px, 2.5vw, 28px)' }}>
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

function BrainLesson() {
  const steps: { n: string; h: string; p: string }[] = [
    {
      n: '01',
      h: 'Start with scope, not solutions',
      p: 'Each department head answers two questions: what do we own, and what do reps wrongly think we own. The second one is where overlap lives.',
    },
    {
      n: '02',
      h: 'Harvest real questions',
      p: 'Ask them for the top 5 questions they actually get from reps plus the answer they usually give. Real language beats policy language.',
    },
    {
      n: '03',
      h: 'Find overlap before drawing lines',
      p: 'Run the overlap report. Two departments claiming the same work is a red flag. The classifier in Helios needs unambiguous owners or it will flip-flop.',
    },
    {
      n: '04',
      h: 'Tag parent-company origin',
      p: 'Blue Raven and Complete Solar often have parallel teams doing 80% of the same thing. Call that out so the brain picks one canonical owner.',
    },
    {
      n: '05',
      h: 'Encode only what is settled',
      p: 'Push agreed-on lines into knowledge-base.md. Leave gray areas as escalation triggers until the org agrees.',
    },
    {
      n: '06',
      h: 'Iterate with real traffic',
      p: 'Once live, every "I don\'t have this one locked in" escalation is a bug report. Feed Sam\'s answers back into the KB monthly.',
    },
  ];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 12,
      }}
    >
      {steps.map((s) => (
        <div key={s.n} className="sp-card" style={{ padding: 16 }}>
          <div
            style={{
              fontSize: 12,
              color: 'var(--sp-blue-soft)',
              fontWeight: 700,
              letterSpacing: '0.12em',
              marginBottom: 6,
            }}
          >
            {s.n}
          </div>
          <div className="sp-h3">{s.h}</div>
          <div className="sp-body" style={{ fontSize: 14 }}>
            {s.p}
          </div>
        </div>
      ))}
    </div>
  );
}

function OrgMap() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 12,
      }}
    >
      {FAKE_ORG.map((g) => (
        <div key={g.parent} className="sp-card" style={{ padding: 14 }}>
          <div
            style={{
              fontSize: 12,
              color: 'var(--sp-text-lo)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            {g.parent}
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--sp-text-md)', fontSize: 14 }}>
            {g.children.map((c) => (
              <li key={c} style={{ marginBottom: 4 }}>
                {c}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

interface FormProps {
  department: string;
  setDepartment: (v: string) => void;
  customDept: string;
  setCustomDept: (v: string) => void;
  parentCompany: string;
  setParentCompany: (v: string) => void;
  headName: string;
  setHeadName: (v: string) => void;
  headRole: string;
  setHeadRole: (v: string) => void;
  purpose: string;
  setPurpose: (v: string) => void;
  owns: string;
  setOwns: (v: string) => void;
  doesNotOwn: string;
  setDoesNotOwn: (v: string) => void;
  topQuestions: string;
  setTopQuestions: (v: string) => void;
  systems: string[];
  toggleSystem: (s: string) => void;
  handoffPartners: string;
  setHandoffPartners: (v: string) => void;
  grayAreas: string;
  setGrayAreas: (v: string) => void;
  contactSla: string;
  setContactSla: (v: string) => void;
  submittedByEmail: string;
  setSubmittedByEmail: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  submitError: string | null;
}

function SubmissionForm(p: FormProps) {
  return (
    <form
      onSubmit={p.onSubmit}
      className="sp-card"
      style={{ padding: 20, marginBottom: 24, display: 'grid', gap: 14 }}
    >
      <Row>
        <Field label="Department" required>
          <select
            value={p.department}
            onChange={(e) => p.setDepartment(e.target.value)}
            style={inputStyle}
          >
            {CRUCIAL_DEPARTMENTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
            <option value="__custom">Other (type it in)</option>
          </select>
          {p.department === '__custom' && (
            <input
              style={{ ...inputStyle, marginTop: 8 }}
              placeholder="Department name"
              value={p.customDept}
              onChange={(e) => p.setCustomDept(e.target.value)}
            />
          )}
        </Field>
        <Field label="Parent company">
          <select
            value={p.parentCompany}
            onChange={(e) => p.setParentCompany(e.target.value)}
            style={inputStyle}
          >
            {PARENT_COMPANIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </Row>

      <Row>
        <Field label="Department head name">
          <input
            style={inputStyle}
            value={p.headName}
            onChange={(e) => p.setHeadName(e.target.value)}
            placeholder="e.g. Jane Rodriguez"
          />
        </Field>
        <Field label="Role title">
          <input
            style={inputStyle}
            value={p.headRole}
            onChange={(e) => p.setHeadRole(e.target.value)}
            placeholder="e.g. Sr. Manager, Install Ops"
          />
        </Field>
      </Row>

      <Field label="Purpose — one sentence" required>
        <input
          style={inputStyle}
          value={p.purpose}
          onChange={(e) => p.setPurpose(e.target.value)}
          placeholder="We own X so that reps can Y."
        />
      </Field>

      <Field
        label="What we own"
        hint="3–6 bullets. Be specific — don't list categories, list outcomes."
        required
      >
        <textarea
          style={{ ...inputStyle, minHeight: 110 }}
          value={p.owns}
          onChange={(e) => p.setOwns(e.target.value)}
          placeholder={'• Approve credit-app resubmissions under $50k\n• Escalate decline reasons to Mosaic/GoodLeap\n• ...'}
        />
      </Field>

      <Field
        label="What we do NOT own (but reps ask us about)"
        hint="This is where overlap hides. Be honest."
      >
        <textarea
          style={{ ...inputStyle, minHeight: 80 }}
          value={p.doesNotOwn}
          onChange={(e) => p.setDoesNotOwn(e.target.value)}
          placeholder={'• Portal login resets — that\'s IT\n• Commission clawbacks — that\'s Pay Ops\n• ...'}
        />
      </Field>

      <Field
        label="Top 5 rep questions + the answer"
        hint="Format: Q: ... / A: ... — one per line-break. Real questions, not polished ones."
        required
      >
        <textarea
          style={{ ...inputStyle, minHeight: 140 }}
          value={p.topQuestions}
          onChange={(e) => p.setTopQuestions(e.target.value)}
          placeholder={'Q: Credit app got declined — can I resubmit?\nA: Yes, once. Email ops@... with the decline reason.\n\nQ: ...\nA: ...'}
        />
      </Field>

      <Field
        label="Systems you work in"
        hint="Multi-select. Pick everything a rep might see you touch."
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SYSTEMS.map((s) => {
            const on = p.systems.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => p.toggleSystem(s)}
                className="sp-badge"
                style={{
                  cursor: 'pointer',
                  color: on ? '#9ecbff' : 'var(--sp-text-md)',
                  borderColor: on ? 'rgba(0, 86, 184, 0.6)' : 'var(--sp-ink-4)',
                  background: on ? 'rgba(0, 86, 184, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="Handoff partners — 'If X, refer to Y'"
        hint="Who do you hand work off to and when?"
      >
        <textarea
          style={{ ...inputStyle, minHeight: 80 }}
          value={p.handoffPartners}
          onChange={(e) => p.setHandoffPartners(e.target.value)}
          placeholder={'• If the issue is system access, refer to IT\n• If it\'s commission timing, refer to Pay Ops'}
        />
      </Field>

      <Field
        label="Known gray areas"
        hint="Stuff that gets bounced around. Name the thing and who you THINK should own it."
      >
        <textarea
          style={{ ...inputStyle, minHeight: 80 }}
          value={p.grayAreas}
          onChange={(e) => p.setGrayAreas(e.target.value)}
        />
      </Field>

      <Row>
        <Field
          label="Contact method / response SLA"
          hint="How reps should reach you and what's reasonable to expect."
        >
          <input
            style={inputStyle}
            value={p.contactSla}
            onChange={(e) => p.setContactSla(e.target.value)}
            placeholder="Email ops-team@... · 24hr SLA"
          />
        </Field>
        <Field label="Your email (optional)">
          <input
            style={inputStyle}
            type="email"
            value={p.submittedByEmail}
            onChange={(e) => p.setSubmittedByEmail(e.target.value)}
            placeholder="So Sam can follow up."
          />
        </Field>
      </Row>

      {p.submitError && (
        <div style={{ color: 'var(--sp-danger)', fontSize: 13 }}>{p.submitError}</div>
      )}
      <div>
        <button className="sp-btn" type="submit" disabled={p.submitting}>
          {p.submitting ? 'Submitting…' : 'Submit scope'}
        </button>
      </div>
    </form>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--sp-text-md)',
          letterSpacing: '0.04em',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--sp-danger)', marginLeft: 4 }}>*</span>}
      </span>
      {hint && (
        <span style={{ fontSize: 12, color: 'var(--sp-text-lo)', lineHeight: 1.45 }}>{hint}</span>
      )}
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--sp-ink-2)',
  border: '1px solid var(--sp-ink-4)',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  color: 'var(--sp-text-hi)',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};

function SubmissionsList({ submissions }: { submissions: Submission[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (!submissions.length) {
    return (
      <div className="sp-card" style={{ padding: 20 }}>
        <div className="sp-body">No submissions yet. Be the first.</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {submissions.map((s) => {
        const open = openId === s.id;
        return (
          <div key={s.id} className="sp-card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : s.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                fontFamily: 'inherit',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <div>
                <div className="sp-h3" style={{ fontSize: 15 }}>
                  {s.department}
                </div>
                <div style={{ fontSize: 12, color: 'var(--sp-text-lo)' }}>
                  {s.parent_company || 'SunPower'} ·{' '}
                  {s.head_name ? `${s.head_name}${s.head_role ? `, ${s.head_role}` : ''}` : 'no head listed'}
                </div>
              </div>
              <span style={{ fontSize: 18, color: 'var(--sp-text-lo)' }}>{open ? '–' : '+'}</span>
            </button>
            {open && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--sp-ink-3)' }}>
                <SubmissionDetail s={s} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SubmissionDetail({ s }: { s: Submission }) {
  return (
    <div style={{ display: 'grid', gap: 12, marginTop: 12, fontSize: 14 }}>
      <DetailBlock label="Purpose" text={s.purpose} />
      <DetailBlock label="Owns" text={s.owns} />
      {s.does_not_own && <DetailBlock label="Does NOT own" text={s.does_not_own} />}
      <DetailBlock label="Top rep questions + answers" text={s.top_questions} />
      {s.systems.length > 0 && (
        <div>
          <DetailLabel>Systems</DetailLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {s.systems.map((x) => (
              <span key={x} className="sp-badge">
                {x}
              </span>
            ))}
          </div>
        </div>
      )}
      {s.handoff_partners && <DetailBlock label="Handoff partners" text={s.handoff_partners} />}
      {s.gray_areas && <DetailBlock label="Gray areas" text={s.gray_areas} />}
      {s.contact_sla && <DetailBlock label="Contact / SLA" text={s.contact_sla} />}
    </div>
  );
}

function DetailBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <DetailLabel>{label}</DetailLabel>
      <div style={{ color: 'var(--sp-text-md)', whiteSpace: 'pre-wrap', marginTop: 4 }}>
        {text}
      </div>
    </div>
  );
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--sp-text-lo)',
      }}
    >
      {children}
    </div>
  );
}

function ReportView({ report }: { report: Report }) {
  return (
    <div className="sp-card" style={{ padding: 20, marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div className="sp-h3" style={{ fontSize: 15 }}>
          Latest report
        </div>
        <div style={{ fontSize: 12, color: 'var(--sp-text-lo)' }}>
          {new Date(report.created_at).toLocaleString()} · {report.submission_count} submissions analyzed
        </div>
      </div>
      <ReportSection title="Overlaps" body={report.overlaps_markdown} />
      <ReportSection title="Gaps" body={report.gaps_markdown} />
      <ReportSection title="Recommendations" body={report.recommendations_markdown} />
    </div>
  );
}

function ReportSection({ title, body }: { title: string; body: string }) {
  if (!body.trim()) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--sp-blue-soft)',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: 'var(--sp-text-md)',
          fontSize: 14,
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
        }}
      >
        {body}
      </div>
    </div>
  );
}
