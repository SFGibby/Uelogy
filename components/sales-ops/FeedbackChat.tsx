'use client';

import { useEffect, useRef, useState } from 'react';

const INK = '#162241';
const SURFACE = '#1D2A4F';
const SURFACE_HI = '#263564';
const LINE = 'rgba(255,255,255,0.08)';
const LINE_HI = 'rgba(255,255,255,0.16)';
const TEXT = '#FFFFFF';
const MUTED = '#8A96B5';
const SUBTLE = '#C4CBE0';
const SUN = '#FAD646';

const SANS = 'var(--font-sales-ops-sans), -apple-system, system-ui, sans-serif';
const DISPLAY = 'var(--font-sales-ops-display), "Archivo Black", Impact, sans-serif';
const MONO = 'var(--font-sales-ops-mono), ui-monospace, monospace';

interface Message {
  id: string;
  from: 'user' | 'bot';
  text: string;
  link?: { href: string; label: string };
  ts: number;
}

interface Intent {
  keywords: string[];
  response: string;
  link?: { href: string; label: string };
}

const INTENTS: Intent[] = [
  {
    keywords: ['adder', 'adders', 'pricing adder'],
    response: 'The Adders Guide has every option broken down by financier.',
    link: { href: '/sales-ops/resources?tab=adders', label: 'Open Adders Guide' },
  },
  {
    keywords: ['finance', 'financier', 'lender', 'loan', 'ppa', 'lease'],
    response: 'Financing lives in the Finance Resource Guide — full lender matrix and financier notes.',
    link: { href: '/sales-ops/resources?tab=finance', label: 'Open Finance Guide' },
  },
  {
    keywords: ['calc', 'calculator', 'payment', 'monthly'],
    response: 'Use the Financing Calculator to estimate monthly payments by lender.',
    link: { href: '/sales-ops/resources?tab=calc', label: 'Open Financing Calculator' },
  },
  {
    keywords: ['panel', 'inverter', 'battery', 'powerwall', 'equipment', 'spec', 'warranty'],
    response: 'The Equipment Guide covers every SKU, warranty, and spec sheet.',
    link: { href: '/sales-ops/resources?tab=equipment', label: 'Open Equipment Guide' },
  },
  {
    keywords: ['contact', 'who do i', 'phone', 'call', 'email', 'hours', 'directory'],
    response: 'All ops teams, hours, phones, and emails are in the Contact Guide.',
    link: { href: '/sales-ops/resources?tab=sales', label: 'Open Contact Guide' },
  },
  {
    keywords: ['faq', 'faqs', 'frequently', 'question'],
    response: 'FAQ has the most common questions and answers.',
    link: { href: '/sales-ops/resources?tab=faqs', label: 'Open FAQs' },
  },
  {
    keywords: ['map', 'geography', 'install speed', 'zip', 'state'],
    response: 'The install-speed map is on the Map tab.',
    link: { href: '/sales-ops/map', label: 'Open Map' },
  },
  {
    keywords: ['pulse', 'kpi', 'bookings', 'install', 'rep', 'leaderboard', 'scorecard'],
    response: 'All leader-facing numbers live on Pulse.',
    link: { href: '/sales-ops/pulse', label: 'Open Pulse' },
  },
];

const COMMON_ASKS = [
  'Where are the adders?',
  'Who do I call for a deal question?',
  'Where\u2019s the financing calculator?',
  'What panels do we offer?',
  'Where is the leaderboard?',
];

function matchIntent(text: string): Intent | null {
  const t = text.toLowerCase();
  for (const intent of INTENTS) {
    for (const kw of intent.keywords) {
      if (t.includes(kw)) return intent;
    }
  }
  return null;
}

function uid(): string {
  return Math.random().toString(36).slice(2);
}

export default function FeedbackChat() {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: uid(),
      from: 'bot',
      text: 'Hey. I\u2019m your Sales Ops shortcut. Ask me where something lives — adders, finance, equipment, contacts, FAQs, map, Pulse — or send a note and it goes straight to Sam.',
      ts: Date.now(),
    },
  ]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function submit(text: string) {
    if (!text.trim() || sending) return;
    setSending(true);
    const user: Message = { id: uid(), from: 'user', text: text.trim(), ts: Date.now() };
    setMessages(m => [...m, user]);
    setDraft('');

    const intent = matchIntent(text);
    await new Promise(r => setTimeout(r, 350));

    if (intent) {
      setMessages(m => [...m, { id: uid(), from: 'bot', text: intent.response, link: intent.link, ts: Date.now() }]);
    } else {
      // No match \u2192 "pass this along"
      setMessages(m => [...m, { id: uid(), from: 'bot', text: 'Got it. I\u2019ll pass this along to Sam.', ts: Date.now() }]);
      // Fire-and-forget log to API (gracefully handle failure \u2014 beta)
      void fetch('/api/sales-ops/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), ts: Date.now() }),
      }).catch(() => {});
    }
    setSending(false);
  }

  return (
    <div style={{ background: INK, color: TEXT, fontFamily: SANS, minHeight: 'calc(100vh - 55px)', display: 'flex' }}>
      {/* chat column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${LINE}` }}>
        <div style={{ padding: '28px 32px 20px', borderBottom: `1px solid ${LINE}` }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.3em', color: SUN, textTransform: 'uppercase', marginBottom: 10 }}>
            Feedback &middot; Shortcut
          </div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 0.95, letterSpacing: '-0.02em', textTransform: 'uppercase', margin: 0 }}>
            Ask or request.
          </h1>
          <p style={{ marginTop: 10, color: SUBTLE, fontSize: 14, maxWidth: 620, lineHeight: 1.5 }}>
            I\u2019m fast on the easy ones (adders, finance, contacts) and I log the rest for Sam.
          </p>
        </div>

        <div ref={scrollRef} style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
          {messages.map(m => (
            <ChatRow key={m.id} m={m} />
          ))}
          {sending && (
            <div style={{ padding: '10px 0', fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.14em' }}>
              Typing{'\u2026'}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(draft); }}
          style={{ display: 'flex', gap: 10, padding: '18px 32px', borderTop: `1px solid ${LINE}`, background: SURFACE }}
        >
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a question or request\u2026"
            style={{
              flex: 1,
              padding: '14px 16px',
              background: INK,
              color: TEXT,
              border: `1px solid ${LINE_HI}`,
              outline: 'none',
              fontSize: 14,
              fontFamily: SANS,
            }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            style={{
              background: SUN,
              color: INK,
              border: 'none',
              padding: '14px 22px',
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontWeight: 700,
              cursor: !draft.trim() || sending ? 'not-allowed' : 'pointer',
              opacity: !draft.trim() || sending ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </form>
      </div>

      {/* sidebar */}
      <aside style={{ width: 320, padding: '28px 24px', background: SURFACE }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.26em', color: MUTED, textTransform: 'uppercase', marginBottom: 14 }}>
          Common asks
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {COMMON_ASKS.map(q => (
            <button
              key={q}
              onClick={() => submit(q)}
              disabled={sending}
              style={{
                textAlign: 'left',
                padding: '12px 14px',
                background: 'transparent',
                border: `1px solid ${LINE_HI}`,
                color: TEXT,
                fontFamily: SANS,
                fontSize: 13,
                cursor: 'pointer',
                lineHeight: 1.4,
              }}
            >
              {q}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${LINE}` }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.26em', color: MUTED, textTransform: 'uppercase', marginBottom: 10 }}>
            How this works
          </div>
          <p style={{ fontSize: 13, color: SUBTLE, lineHeight: 1.5 }}>
            Keyword match for the known asks. Everything else gets logged for Sam to review. v2 will carry Claude or GPT for real Q&amp;A against the knowledge base.
          </p>
        </div>
      </aside>
    </div>
  );
}

function ChatRow({ m }: { m: Message }) {
  const isUser = m.from === 'user';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
      <div
        style={{
          background: isUser ? SUN : SURFACE_HI,
          color: isUser ? INK : TEXT,
          padding: '12px 16px',
          maxWidth: '70%',
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        {m.text}
      </div>
      {m.link && !isUser && (
        <a
          href={m.link.href}
          style={{
            marginTop: 8,
            padding: '10px 16px',
            background: 'transparent',
            border: `1px solid ${SUN}`,
            color: SUN,
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {m.link.label} {'\u2192'}
        </a>
      )}
    </div>
  );
}
