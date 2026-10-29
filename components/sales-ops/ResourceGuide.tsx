'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ResourceTab } from '../../lib/sales-ops/parse-resources';

const SANS = 'var(--font-swagger-sans), -apple-system, system-ui, sans-serif';
const DISPLAY = 'var(--font-swagger-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-swagger-mono), ui-monospace, monospace';

const INK = '#0D1023';
const SURFACE = '#171B38';
const SURFACE_HI = '#242A58';
const LINE = 'rgba(255,255,255,0.08)';
const LINE_HI = 'rgba(255,255,255,0.14)';
const TEXT = '#FFFFFF';
const SUBTLE = '#CED3E8';
const MUTED = '#8B91B5';
const SUN = '#FAD646';

export default function ResourceGuide({ tabs }: { tabs: ResourceTab[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const initialTab = params.get('tab') ?? tabs[0]?.key ?? 'sales';
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const p = params.get('tab');
    if (p && p !== tab) setTab(p);
  }, [params, tab]);

  function switchTab(k: string) {
    setTab(k);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', k);
    router.replace(url.pathname + '?' + url.searchParams.toString(), { scroll: false });
  }

  const active = tabs.find(t => t.key === tab) ?? tabs[0];
  const q = query.trim().toLowerCase();
  const filteredSections = q && active
    ? active.sections.filter(s => s.title.toLowerCase().includes(q) || s.cards.some(c => c.title.toLowerCase().includes(q) || c.body.toLowerCase().includes(q)))
    : active?.sections ?? [];

  return (
    <div style={{ background: INK, color: TEXT, fontFamily: SANS, minHeight: 'calc(100vh - 55px)' }}>
      {/* HERO */}
      <section style={{ padding: '48px 32px 24px', borderBottom: `1px solid ${LINE}`, position: 'relative', overflow: 'hidden' }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 50% 60% at 80% 20%, rgba(250,214,70,0.14), transparent 65%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.3em', color: SUN, textTransform: 'uppercase', marginBottom: 16 }}>
            Resource guide
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: DISPLAY,
              fontSize: 'clamp(44px, 7vw, 88px)',
              lineHeight: 0.92,
              letterSpacing: '-0.025em',
              textTransform: 'uppercase',
            }}
          >
            Mid-pitch,<br /><span style={{ color: SUN }}>on tap.</span>
          </h1>
          <p style={{ marginTop: 18, maxWidth: 540, fontSize: 15, lineHeight: 1.6, color: SUBTLE }}>
            Contacts, financing, calculators, adders, equipment, FAQs. Updated in the repo by Colten.
          </p>
        </div>
      </section>

      {/* TAB PILLS */}
      <section style={{ padding: '20px 32px', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flexWrap: 'wrap' }}>
          {tabs.map(t => {
            const isActive = t.key === tab;
            return (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                style={{
                  padding: '10px 20px',
                  background: isActive ? SUN : 'transparent',
                  color: isActive ? INK : TEXT,
                  border: `1px solid ${isActive ? SUN : LINE_HI}`,
                  borderRadius: 999,
                  fontFamily: DISPLAY,
                  fontSize: 12,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* SEARCH */}
      <section style={{ padding: '18px 32px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${active?.label ?? 'guide'}`}
          style={{
            flex: 1,
            maxWidth: 420,
            padding: '12px 14px',
            background: SURFACE,
            color: TEXT,
            border: `1px solid ${LINE_HI}`,
            borderRadius: 999,
            outline: 'none',
            fontFamily: SANS,
            fontSize: 14,
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              background: 'transparent',
              color: SUBTLE,
              border: `1px solid ${LINE_HI}`,
              borderRadius: 999,
              padding: '10px 16px',
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {filteredSections.length} {filteredSections.length === 1 ? 'section' : 'sections'}
        </div>
      </section>

      {/* CONTENT */}
      <section style={{ padding: '14px 32px 56px' }}>
        {filteredSections.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: MUTED, fontSize: 14 }}>
            No matches in {active?.label ?? 'this tab'}.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {filteredSections.map(section => (
            <section key={section.id} style={{ background: SURFACE, border: `1px solid ${LINE_HI}`, borderRadius: 14, overflow: 'hidden' }}>
              <header style={{ padding: '18px 22px', borderBottom: `1px solid ${LINE}` }}>
                <h2 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 18, letterSpacing: '-0.005em', textTransform: 'uppercase', color: TEXT }}>
                  {section.title}
                </h2>
              </header>
              <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                {section.cards.map((card, i) => (
                  <Card key={i} card={card} />
                ))}
                {section.cards.length === 0 && (
                  <div style={{ color: MUTED, fontSize: 12, fontStyle: 'italic', padding: '6px 0' }}>No entries yet.</div>
                )}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

function Card({ card }: { card: { title: string; body: string; highlight: boolean } }) {
  return (
    <div
      style={{
        background: card.highlight ? SURFACE_HI : INK,
        border: `1px solid ${card.highlight ? SUN : LINE_HI}`,
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      {card.title && (
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: card.highlight ? SUN : MUTED, textTransform: 'uppercase', marginBottom: 8 }}>
          {card.title}
        </div>
      )}
      <div
        style={{ fontSize: 13, color: SUBTLE, lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: card.body }}
      />
    </div>
  );
}
