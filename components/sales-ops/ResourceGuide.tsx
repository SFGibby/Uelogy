'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ResourceTab } from '../../lib/sales-ops/parse-resources';

const SANS = 'Arial, Helvetica, sans-serif';
const MONO = 'ui-monospace, Menlo, Consolas, monospace';

const INK = '#162241';
const SURFACE = '#1A2648';
const SURFACE_HI = '#1D2C55';
const LINE = '#26355f';
const LINE_HI = '#33436e';
const TEXT = '#ffffff';
const TEXT_SOFT = '#e6e9f0';
const SUBTLE = '#cfd5e2';
const MUTED = '#9aa3b5';
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
    ? active.sections.filter(s => {
        if (s.title.toLowerCase().includes(q)) return true;
        return s.cards.some(c => c.title.toLowerCase().includes(q) || c.body.toLowerCase().includes(q));
      })
    : active?.sections ?? [];

  return (
    <div style={{ background: INK, color: TEXT_SOFT, fontFamily: SANS, minHeight: 'calc(100vh - 55px)' }}>
      {/* Page header */}
      <div style={{ padding: '20px 28px 22px', borderBottom: `1px solid ${LINE}` }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: TEXT, letterSpacing: '-0.005em' }}>Resource guide</h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: SUBTLE, lineHeight: 1.5, maxWidth: 760 }}>
          Everything a rep needs mid-pitch: contacts, financing, calculators, adders, equipment, FAQs.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 28px 0', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
          {tabs.map(t => {
            const isActive = t.key === tab;
            return (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  color: isActive ? SUN : SUBTLE,
                  border: 0,
                  borderBottom: `2px solid ${isActive ? SUN : 'transparent'}`,
                  cursor: 'pointer',
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 400,
                  whiteSpace: 'nowrap',
                  marginBottom: -1,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '14px 28px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${active?.label ?? 'guide'}\u2026`}
          style={{
            flex: 1,
            maxWidth: 360,
            padding: '9px 12px',
            background: SURFACE,
            color: TEXT,
            border: `1px solid ${LINE_HI}`,
            borderRadius: 4,
            outline: 'none',
            fontFamily: SANS,
            fontSize: 13,
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              background: 'transparent',
              color: MUTED,
              border: `1px solid ${LINE}`,
              borderRadius: 4,
              padding: '8px 12px',
              fontFamily: MONO,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: MUTED }}>
          {filteredSections.length} {filteredSections.length === 1 ? 'section' : 'sections'}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 28px 48px' }}>
        {filteredSections.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: MUTED, fontSize: 13 }}>
            No matches in {active?.label ?? 'this tab'}.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          {filteredSections.map(section => (
            <section key={section.id} style={{ background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 6, overflow: 'hidden' }}>
              <header style={{ padding: '14px 18px', borderBottom: `1px solid ${LINE}` }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TEXT, letterSpacing: '-0.005em' }}>
                  {section.title}
                </h2>
              </header>
              <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {section.cards.map((card, i) => (
                  <Card key={i} card={card} />
                ))}
                {section.cards.length === 0 && (
                  <div style={{ color: MUTED, fontSize: 12, fontStyle: 'italic', padding: '6px 0' }}>
                    No entries yet.
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ card }: { card: { title: string; body: string; highlight: boolean } }) {
  return (
    <div
      style={{
        background: card.highlight ? SURFACE_HI : 'transparent',
        border: `1px solid ${card.highlight ? SUN : LINE_HI}`,
        borderRadius: 4,
        padding: '12px 14px',
      }}
    >
      {card.title && (
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', color: card.highlight ? SUN : MUTED, textTransform: 'uppercase', marginBottom: 6 }}>
          {card.title}
        </div>
      )}
      <div
        style={{ fontSize: 13, color: TEXT_SOFT, lineHeight: 1.55 }}
        dangerouslySetInnerHTML={{ __html: card.body }}
      />
    </div>
  );
}
