'use client';

import { useEffect, useMemo, useState } from 'react';

const SANS = 'var(--font-gibson-sans), -apple-system, system-ui, sans-serif';
const DISPLAY = 'var(--font-gibson-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-gibson-mono), ui-monospace, monospace';

const INK = '#0D1023';
const SURFACE = '#171B38';
const SURFACE_HI = '#242A58';
const LINE = 'rgba(255,255,255,0.08)';
const LINE_HI = 'rgba(255,255,255,0.15)';
const TEXT = '#FFFFFF';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

interface Card { title: string; body: string; highlight: boolean; }
interface SectionCards { kind: 'cards'; id?: string; title: string; cards: Card[]; }
interface SectionFinancier { kind: 'financier'; id?: string; title: string; meta: string; cards: Card[]; }
interface SectionTable { kind: 'table'; title: string; description?: string; content: { headings: string[]; rows: string[][] }; }
interface SectionFaq { kind: 'faq'; title: string; content: { items: Array<{ id: string; question: string; answer: string }> }; }
type Section = SectionCards | SectionFinancier | SectionTable | SectionFaq;

interface Tab {
  key: string;
  label: string;
  hero: { title: string; subtitle: string };
  pills?: Array<{ key: string; label: string }>;
  sections: Section[];
}

interface Resources { updatedAt: string; tabs: Tab[]; }

export default function ResourceFrame() {
  const [data, setData] = useState<Resources | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tabKey, setTabKey] = useState<string>('sales');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    fetch('/sales-ops/data/resources.json', { cache: 'force-cache' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`http ${r.status}`)))
      .then((d: Resources) => { if (alive) setData(d); })
      .catch(e => { if (alive) setErr(String(e)); });
    return () => { alive = false; };
  }, []);

  if (err) return <Shell><div style={{ padding: 48, color: '#FF8B9F', fontFamily: SANS }}>Resource guide failed to load: {err}</div></Shell>;
  if (!data) return <Shell><Loading /></Shell>;

  const tab = data.tabs.find(t => t.key === tabKey) ?? data.tabs[0];
  const q = query.trim().toLowerCase();

  return (
    <Shell>
      <style>{resourceStyles}</style>
      <Hero tabLabel={tab.label} />

      <nav
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 8,
          padding: '18px 32px', borderBottom: `1px solid ${LINE_HI}`,
          background: INK, position: 'sticky', top: 55, zIndex: 20,
        }}
      >
        {data.tabs.map(t => {
          const active = t.key === tab.key;
          return (
            <button
              key={t.key}
              onClick={() => { setTabKey(t.key); setQuery(''); }}
              style={{
                padding: '10px 18px',
                background: active ? SUN : 'transparent',
                color: active ? INK : TEXT,
                border: `1px solid ${active ? SUN : LINE_HI}`,
                borderRadius: 999,
                fontFamily: DISPLAY,
                fontSize: 12,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      <section style={{ padding: '20px 32px 12px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${tab.label.toLowerCase()}`}
          style={{
            flex: 1, minWidth: 220, maxWidth: 420,
            padding: '10px 16px',
            background: SURFACE,
            color: TEXT,
            border: `1px solid ${LINE_HI}`,
            borderRadius: 999,
            outline: 'none',
            fontSize: 13,
            fontFamily: SANS,
          }}
        />
        <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Updated {new Date(data.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      </section>

      <main style={{ padding: '12px 32px 64px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {tab.sections.map((s, idx) => (
          <SectionBlock key={(s as { id?: string }).id ?? `${s.kind}-${idx}`} section={s} query={q} />
        ))}
      </main>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: INK, color: TEXT, fontFamily: SANS, minHeight: 'calc(100vh - 55px)' }}>
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div style={{ padding: 48, color: MUTED, fontFamily: MONO, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
      Loading{'\u2026'}
    </div>
  );
}

function Hero({ tabLabel }: { tabLabel: string }) {
  return (
    <section style={{ padding: '32px 32px 10px' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.3em', color: SUN, textTransform: 'uppercase', marginBottom: 10 }}>
        Resource guide
      </div>
      <h1
        style={{
          margin: 0,
          fontFamily: DISPLAY,
          fontSize: 'clamp(36px, 6vw, 72px)',
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
        }}
      >
        Mid-pitch,<br />
        <span style={{ color: SUN }}>on tap.</span>
      </h1>
      <p style={{ marginTop: 12, maxWidth: 620, color: SUBTLE, fontSize: 14, lineHeight: 1.6 }}>
        Everything a sales leader needs between the knock and the close. {tabLabel} is the live mirror of Colten&rsquo;s source.
      </p>
    </section>
  );
}

// --- section blocks ------------------------------------------------------

function SectionBlock({ section, query }: { section: Section; query: string }) {
  if (section.kind === 'table') return <TableBlock section={section} query={query} />;
  if (section.kind === 'faq')   return <FaqBlock section={section} query={query} />;
  if (section.kind === 'financier') return <FinancierBlock section={section} query={query} />;
  return <CardsBlock section={section} query={query} />;
}

function cardMatches(c: Card, q: string): boolean {
  if (!q) return true;
  const hay = `${c.title} ${c.body}`.toLowerCase();
  return hay.includes(q);
}

function sectionTitleMatches(title: string, q: string): boolean {
  if (!q) return true;
  return title.toLowerCase().includes(q);
}

function CardsBlock({ section, query }: { section: SectionCards; query: string }) {
  const cards = useMemo(() => section.cards.filter(c => cardMatches(c, query)), [section.cards, query]);
  if (query && cards.length === 0 && !sectionTitleMatches(section.title, query)) return null;
  const show = sectionTitleMatches(section.title, query) ? section.cards : cards;

  return (
    <SectionShell title={section.title}>
      <div style={cardGrid}>
        {show.map((c, i) => <CardTile key={i} card={c} />)}
      </div>
    </SectionShell>
  );
}

function FinancierBlock({ section, query }: { section: SectionFinancier; query: string }) {
  const [open, setOpen] = useState(false);
  const cards = section.cards.filter(c => cardMatches(c, query));
  const matchesTitle = sectionTitleMatches(section.title, query) || !!section.meta?.toLowerCase().includes(query);
  if (query && cards.length === 0 && !matchesTitle) return null;
  const show = matchesTitle ? section.cards : cards;
  const wantsOpen = open || !!query;

  return (
    <article style={{ background: SURFACE, border: `1px solid ${LINE_HI}`, borderRadius: 12 }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={wantsOpen}
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 16,
          alignItems: 'center',
          padding: '18px 22px',
          background: 'transparent',
          color: TEXT,
          border: 0,
          cursor: 'pointer',
          fontFamily: SANS,
          textAlign: 'left',
        }}
      >
        <span>
          <div style={{ fontFamily: DISPLAY, fontSize: 18, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
            {section.title}
          </div>
          {section.meta && (
            <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 6 }}>
              {section.meta}
            </div>
          )}
        </span>
        <Chevron open={wantsOpen} />
      </button>
      {wantsOpen && (
        <div style={{ padding: '2px 22px 22px', borderTop: `1px solid ${LINE}` }}>
          <div style={cardGrid}>
            {show.map((c, i) => <CardTile key={i} card={c} />)}
          </div>
        </div>
      )}
    </article>
  );
}

function TableBlock({ section, query }: { section: SectionTable; query: string }) {
  const { headings, rows } = section.content;
  const filteredRows = useMemo(() => {
    if (!query) return rows;
    return rows.filter(r => r.some(cell => cell.toLowerCase().includes(query)));
  }, [rows, query]);
  if (query && filteredRows.length === 0) return null;

  return (
    <SectionShell title={section.title} description={section.description}>
      <div style={{ overflowX: 'auto', background: SURFACE, border: `1px solid ${LINE_HI}`, borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {headings.map((h, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    fontFamily: MONO,
                    fontSize: 11,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: SUN,
                    borderBottom: `1px solid ${LINE_HI}`,
                    whiteSpace: 'nowrap',
                    position: 'sticky',
                    top: 0,
                    background: SURFACE,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: `1px solid ${LINE}` }}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '12px 16px',
                      verticalAlign: 'top',
                      color: ci === 0 ? SUBTLE : TEXT,
                      fontFamily: ci === 0 ? MONO : SANS,
                      fontSize: ci === 0 ? 11 : 13,
                      letterSpacing: ci === 0 ? '0.14em' : undefined,
                      textTransform: ci === 0 ? 'uppercase' : undefined,
                      lineHeight: 1.5,
                      minWidth: 170,
                    }}
                    dangerouslySetInnerHTML={{ __html: cell }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

function FaqBlock({ section, query }: { section: SectionFaq; query: string }) {
  const items = useMemo(() => section.content.items.filter(it => {
    if (!query) return true;
    return `${it.question} ${it.answer}`.toLowerCase().includes(query);
  }), [section.content.items, query]);

  return (
    <SectionShell title={`${section.title} \u00b7 ${items.length}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(it => <FaqItem key={it.id} item={it} forceOpen={!!query} />)}
      </div>
    </SectionShell>
  );
}

function FaqItem({ item, forceOpen }: { item: { id: string; question: string; answer: string }; forceOpen: boolean }) {
  const [open, setOpen] = useState(false);
  const show = open || forceOpen;
  return (
    <article style={{ background: SURFACE, border: `1px solid ${LINE_HI}`, borderRadius: 10 }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={show}
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          gap: 14,
          padding: '14px 18px',
          background: 'transparent',
          color: TEXT,
          border: 0,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: SANS,
          fontSize: 14,
          lineHeight: 1.4,
        }}
      >
        <span>{item.question}</span>
        <Chevron open={show} />
      </button>
      {show && (
        <div
          style={{
            padding: '0 18px 16px',
            color: SUBTLE,
            fontSize: 13,
            lineHeight: 1.6,
          }}
          dangerouslySetInnerHTML={{ __html: item.answer }}
        />
      )}
    </article>
  );
}

// --- shared bits ---------------------------------------------------------

function SectionShell({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: MUTED, textTransform: 'uppercase', marginBottom: 6 }}>
        Section
      </div>
      <h2 style={{ margin: '0 0 6px', fontFamily: DISPLAY, fontSize: 20, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
        {title}
      </h2>
      {description && <p style={{ margin: '0 0 14px', color: SUBTLE, fontSize: 13, lineHeight: 1.5 }}>{description}</p>}
      {children}
    </section>
  );
}

function CardTile({ card }: { card: Card }) {
  return (
    <article
      style={{
        background: card.highlight ? SURFACE_HI : SURFACE,
        border: `1px solid ${card.highlight ? SUN : LINE_HI}`,
        borderRadius: 10,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {card.title && (
        <h4 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: card.highlight ? SUN : TEXT }}>
          {card.title}
        </h4>
      )}
      <div
        style={{ color: SUBTLE, fontSize: 13, lineHeight: 1.6 }}
        className="resource-card-body"
        dangerouslySetInnerHTML={{ __html: card.body }}
      />
    </article>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <span style={{ color: SUBTLE, display: 'inline-flex', transition: 'transform 160ms ease', transform: open ? 'rotate(180deg)' : 'none' }} aria-hidden>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  );
}

const cardGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 12,
};

const resourceStyles = `
.resource-card-body a { color: #FAD646; text-decoration: underline; text-underline-offset: 2px; }
.resource-card-body a:hover { color: #ffffff; }
.resource-card-body ul, .resource-card-body ol { margin: 8px 0; padding-left: 20px; }
.resource-card-body li { margin: 4px 0; }
.resource-card-body b, .resource-card-body strong { color: #FFFFFF; }
.resource-card-body i, .resource-card-body em { color: #CED3E8; }
.resource-card-body u { text-decoration-color: rgba(250,214,70,0.6); text-underline-offset: 3px; }
.resource-card-body code { background: rgba(255,255,255,0.08); padding: 1px 6px; border-radius: 4px; font-size: 12px; }
.resource-card-body br + br { display: block; content: ''; margin-top: 6px; }
.resource-card-body p { margin: 0 0 8px; }
.resource-card-body p:last-child { margin-bottom: 0; }
`;
