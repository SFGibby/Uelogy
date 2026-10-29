'use client';

import { useEffect, useRef, useState } from 'react';

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
    response: 'Financing lives in the Finance Resource Guide \u2014 full lender matrix and financier notes.',
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
      text: 'I\u2019m your Sales Ops shortcut. Ask where something lives \u2014 adders, finance, equipment, contacts, FAQs, map, Pulse \u2014 or send a note and it goes to Sam.',
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
      setMessages(m => [...m, { id: uid(), from: 'bot', text: 'Got it. I\u2019ll pass this along to Sam.', ts: Date.now() }]);
      void fetch('/api/sales-ops/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), ts: Date.now() }),
      }).catch(() => {});
    }
    setSending(false);
  }

  return (
    <div style={{ background: INK, color: TEXT_SOFT, fontFamily: SANS, minHeight: 'calc(100vh - 55px)' }}>
      <div style={{ padding: '20px 28px 22px', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.04em', color: MUTED, marginBottom: 6 }}>
          SP &middot; Sales Ops &middot; Feedback
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: TEXT, letterSpacing: '-0.005em' }}>Ask or request</h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: SUBTLE, lineHeight: 1.5, maxWidth: 760 }}>
          Fast on the easy ones (adders, finance, contacts). Logs the rest for Sam.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 'calc(100vh - 55px - 100px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${LINE}` }}>
          <div ref={scrollRef} style={{ flex: 1, padding: '20px 28px', overflowY: 'auto' }}>
            {messages.map(m => <ChatRow key={m.id} m={m} />)}
            {sending && (
              <div style={{ padding: '8px 0', fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.04em' }}>
                Typing{'\u2026'}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); submit(draft); }}
            style={{ display: 'flex', gap: 8, padding: '14px 28px', borderTop: `1px solid ${LINE}`, background: SURFACE }}
          >
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a question or request\u2026"
              style={{
                flex: 1,
                padding: '10px 12px',
                background: INK,
                color: TEXT,
                border: `1px solid ${LINE_HI}`,
                borderRadius: 4,
                outline: 'none',
                fontSize: 13,
                fontFamily: SANS,
              }}
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              style={{
                background: SUN,
                color: INK,
                border: 0,
                borderRadius: 4,
                padding: '10px 18px',
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 700,
                cursor: !draft.trim() || sending ? 'not-allowed' : 'pointer',
                opacity: !draft.trim() || sending ? 0.5 : 1,
              }}
            >
              Send
            </button>
          </form>
        </div>

        <aside style={{ padding: '20px 20px', background: SURFACE }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.04em', color: MUTED, marginBottom: 10 }}>
            Common asks
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {COMMON_ASKS.map(q => (
              <button
                key={q}
                onClick={() => submit(q)}
                disabled={sending}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: `1px solid ${LINE_HI}`,
                  borderRadius: 4,
                  color: TEXT_SOFT,
                  fontFamily: SANS,
                  fontSize: 12,
                  cursor: 'pointer',
                  lineHeight: 1.4,
                }}
              >
                {q}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${LINE}` }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.04em', color: MUTED, marginBottom: 8 }}>
              How this works
            </div>
            <p style={{ fontSize: 12, color: SUBTLE, lineHeight: 1.5 }}>
              Keyword match for the known asks. Everything else gets logged for Sam. v2 wires Claude for real Q&amp;A against the KB.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ChatRow({ m }: { m: Message }) {
  const isUser = m.from === 'user';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div
        style={{
          background: isUser ? SUN : SURFACE_HI,
          color: isUser ? INK : TEXT_SOFT,
          padding: '10px 14px',
          maxWidth: '70%',
          fontSize: 13,
          lineHeight: 1.5,
          borderRadius: 4,
        }}
      >
        {m.text}
      </div>
      {m.link && !isUser && (
        <a
          href={m.link.href}
          style={{
            marginTop: 6,
            padding: '8px 12px',
            background: 'transparent',
            border: `1px solid ${SUN}`,
            borderRadius: 4,
            color: SUN,
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {m.link.label} {'\u2192'}
        </a>
      )}
    </div>
  );
}
