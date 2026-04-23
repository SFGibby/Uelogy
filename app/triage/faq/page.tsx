import Link from 'next/link';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BRAIN_DIR = join(process.cwd(), 'app', 'triage', 'brain');
const SKIP = new Set(['_template.md', 'README.md']);

const CATEGORY_ORDER = [
  'account-access',
  'enerflo-pricing',
  'panels-equipment',
  'integrations',
  'design-tools',
  'financing',
  'utility-data',
  'policy-process',
];

const CATEGORY_LABEL: Record<string, string> = {
  'account-access': 'Account & access',
  'enerflo-pricing': 'Enerflo pricing',
  'panels-equipment': 'Panels & equipment',
  'integrations': 'Integrations',
  'design-tools': 'Design tools',
  'financing': 'Financing',
  'utility-data': 'Utility data',
  'policy-process': 'Policy & process',
};

interface Entry {
  slug: string;
  category: string;
  title: string;
  systems: string[];
  owner: string;
  escalateTo: string;
  tags: string[];
  seenIn: string[];
  symptom: string;
  likelyCause: string[];
  resolution: string[];
  related: string[];
  todoCount: number;
}

function stripTodo(raw: string): string {
  return raw.replace(/<!--\s*TODO[^>]*?-->/gi, '').trim();
}

function countTodo(raw: string): number {
  return (raw.match(/<!--\s*TODO/gi) ?? []).length;
}

function parseList(raw: string): string[] {
  const s = raw.trim();
  if (!s || s === '[]') return [];
  if (s.startsWith('[') && s.endsWith(']')) {
    return s
      .slice(1, -1)
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [s];
}

function parseEntry(category: string, slug: string, raw: string): Entry {
  const todoCount = countTodo(raw);
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const fm = fmMatch ? fmMatch[1] : '';
  const body = fmMatch ? fmMatch[2] : raw;

  const fmMap: Record<string, string> = {};
  for (const line of fm.split('\n')) {
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (m) fmMap[m[1]] = stripTodo(m[2]);
  }

  const sections: Record<string, string> = {};
  let current = '';
  for (const line of body.split('\n')) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) {
      current = h[1].toLowerCase();
      sections[current] = '';
    } else if (current) {
      sections[current] += line + '\n';
    }
  }

  const bullets = (s: string | undefined) =>
    (s ?? '')
      .split('\n')
      .map((l) => l.replace(/^[-*]\s+/, '').trim())
      .filter((l) => l.length > 0)
      .map(stripTodo)
      .filter(Boolean);

  const numbered = (s: string | undefined) =>
    (s ?? '')
      .split('\n')
      .map((l) => l.replace(/^\d+\.\s+/, '').trim())
      .filter((l) => l.length > 0)
      .map(stripTodo)
      .filter(Boolean);

  return {
    slug,
    category,
    title: stripTodo(fmMap.title ?? slug),
    systems: parseList(fmMap.systems ?? ''),
    owner: fmMap.owner ?? '',
    escalateTo: fmMap.escalate_to ?? '',
    tags: parseList(fmMap.tags ?? ''),
    seenIn: parseList(fmMap.seen_in ?? ''),
    symptom: stripTodo((sections['symptom'] ?? '').trim()),
    likelyCause: bullets(sections['likely cause']),
    resolution: numbered(sections['resolution']),
    related: bullets(sections['related']),
    todoCount,
  };
}

function loadEntries(): Entry[] {
  const out: Entry[] = [];
  let categories: string[] = [];
  try {
    categories = readdirSync(BRAIN_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
      .map((d) => d.name);
  } catch {
    return [];
  }
  for (const cat of categories) {
    let files: string[] = [];
    try {
      files = readdirSync(join(BRAIN_DIR, cat)).filter(
        (f) => f.endsWith('.md') && !SKIP.has(f),
      );
    } catch {
      continue;
    }
    for (const f of files) {
      const raw = readFileSync(join(BRAIN_DIR, cat, f), 'utf8');
      out.push(parseEntry(cat, f.replace(/\.md$/, ''), raw));
    }
  }
  const orderIdx = (c: string) => {
    const i = CATEGORY_ORDER.indexOf(c);
    return i === -1 ? 999 : i;
  };
  out.sort((a, b) => {
    const ca = orderIdx(a.category) - orderIdx(b.category);
    if (ca !== 0) return ca;
    return a.title.localeCompare(b.title);
  });
  return out;
}

export default function FAQPage() {
  const entries = loadEntries();
  const byCat = new Map<string, Entry[]>();
  for (const e of entries) {
    const arr = byCat.get(e.category) ?? [];
    arr.push(e);
    byCat.set(e.category, arr);
  }
  const cats = Array.from(byCat.keys()).sort(
    (a, b) =>
      (CATEGORY_ORDER.indexOf(a) === -1 ? 999 : CATEGORY_ORDER.indexOf(a)) -
      (CATEGORY_ORDER.indexOf(b) === -1 ? 999 : CATEGORY_ORDER.indexOf(b)),
  );

  return (
    <main>
      <section style={{ position: 'relative', padding: '56px 0 32px', overflow: 'hidden' }}>
        <div className="sp-mesh" />
        <div className="sp-grid" />
        <div className="sp-container">
          <div className="sp-eyebrow">Triage · FAQ</div>
          <h1 className="sp-h1" style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
            Real issues,
            <br />
            <span style={{ color: 'var(--sp-blue-soft)' }}>real answers.</span>
          </h1>
          <p className="sp-lead">
            Drawn from the long-tail brain at{' '}
            <code style={codeStyle}>app/triage/brain/</code>. {entries.length} entries across{' '}
            {cats.length} categories. Links are anchor-safe: share e.g.{' '}
            <code style={codeStyle}>/triage/faq#{entries[0]?.slug ?? 'example'}</code>.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
            {cats.map((c) => (
              <a
                key={c}
                href={`#cat-${c}`}
                className="sp-card"
                style={{
                  padding: '6px 12px',
                  fontSize: 13,
                  textDecoration: 'none',
                  color: 'var(--sp-text-hi)',
                }}
              >
                {CATEGORY_LABEL[c] ?? c}{' '}
                <span style={{ color: 'var(--sp-text-lo)' }}>
                  · {byCat.get(c)?.length ?? 0}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="sp-section" style={{ paddingTop: 8 }}>
        <div className="sp-container">
          {cats.map((cat) => {
            const items = byCat.get(cat) ?? [];
            return (
              <div key={cat} id={`cat-${cat}`} style={{ marginBottom: 44, scrollMarginTop: 90 }}>
                <h2 className="sp-h2" style={{ fontSize: 24, marginBottom: 16 }}>
                  {CATEGORY_LABEL[cat] ?? cat}
                  <span
                    style={{
                      color: 'var(--sp-text-lo)',
                      fontSize: 14,
                      fontWeight: 400,
                      marginLeft: 10,
                    }}
                  >
                    {items.length} {items.length === 1 ? 'entry' : 'entries'}
                  </span>
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {items.map((e) => (
                    <details
                      key={e.slug}
                      id={e.slug}
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
                        <span style={{ flex: 1 }}>{e.title}</span>
                        {e.systems.length > 0 && (
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--sp-text-lo)',
                              fontWeight: 400,
                            }}
                          >
                            {e.systems.join(' · ')}
                          </span>
                        )}
                        {e.todoCount > 0 && (
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--sp-warn)',
                              fontWeight: 500,
                              border: '1px solid var(--sp-warn)',
                              padding: '1px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {e.todoCount} TODO
                          </span>
                        )}
                      </summary>

                      <div style={{ paddingLeft: 26, marginTop: 14 }}>
                        {e.symptom && (
                          <div style={sectionStyle}>
                            <div className="sp-eyebrow" style={eyebrowStyle}>
                              Symptom
                            </div>
                            <p className="sp-body" style={bodyStyle}>
                              {e.symptom}
                            </p>
                          </div>
                        )}

                        {e.likelyCause.length > 0 && (
                          <div style={sectionStyle}>
                            <div className="sp-eyebrow" style={eyebrowStyle}>
                              Likely cause
                            </div>
                            <ul style={listStyle}>
                              {e.likelyCause.map((c, i) => (
                                <li key={i} className="sp-body" style={bodyStyle}>
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {e.resolution.length > 0 && (
                          <div style={sectionStyle}>
                            <div className="sp-eyebrow" style={eyebrowStyle}>
                              Resolution
                            </div>
                            <ol style={listStyle}>
                              {e.resolution.map((s, i) => (
                                <li key={i} className="sp-body" style={bodyStyle}>
                                  {s}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {e.related.length > 0 && (
                          <div style={sectionStyle}>
                            <div className="sp-eyebrow" style={eyebrowStyle}>
                              Related
                            </div>
                            <ul style={listStyle}>
                              {e.related.map((r, i) => (
                                <li key={i} className="sp-body" style={bodyStyle}>
                                  <code style={codeStyle}>{r}</code>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div style={metaRowStyle}>
                          {e.owner && (
                            <span>
                              <span style={metaLabelStyle}>Owner</span> {e.owner}
                            </span>
                          )}
                          {e.escalateTo && (
                            <span>
                              <span style={metaLabelStyle}>Escalate</span> {e.escalateTo}
                            </span>
                          )}
                          {e.seenIn.length > 0 && (
                            <span>
                              <span style={metaLabelStyle}>Seen</span> {e.seenIn.length}×{' '}
                              ({e.seenIn[0]}
                              {e.seenIn.length > 1 ? `–${e.seenIn[e.seenIn.length - 1]}` : ''})
                            </span>
                          )}
                          <Link href={`#${e.slug}`} style={anchorStyle}>
                            #{e.slug}
                          </Link>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            );
          })}

          {entries.length === 0 && (
            <div className="sp-card" style={{ padding: 20, borderStyle: 'dashed' }}>
              <div className="sp-eyebrow">Empty</div>
              <p className="sp-body" style={{ marginTop: 6 }}>
                No brain entries found under <code style={codeStyle}>app/triage/brain/</code>.
              </p>
            </div>
          )}
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

const sectionStyle: React.CSSProperties = { marginBottom: 14 };

const eyebrowStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.1em',
  color: 'var(--sp-text-lo)',
  marginBottom: 4,
};

const bodyStyle: React.CSSProperties = {
  margin: '4px 0',
  color: 'var(--sp-text-md)',
  fontSize: 14,
  lineHeight: 1.55,
};

const listStyle: React.CSSProperties = { margin: '4px 0', paddingLeft: 20 };

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '14px',
  marginTop: 14,
  paddingTop: 12,
  borderTop: '1px solid var(--sp-ink-3)',
  fontSize: 12,
  color: 'var(--sp-text-md)',
};

const metaLabelStyle: React.CSSProperties = {
  color: 'var(--sp-text-lo)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontSize: 10,
  marginRight: 4,
};

const anchorStyle: React.CSSProperties = {
  marginLeft: 'auto',
  fontSize: 12,
  color: 'var(--sp-text-lo)',
  textDecoration: 'none',
  letterSpacing: '0.05em',
};
