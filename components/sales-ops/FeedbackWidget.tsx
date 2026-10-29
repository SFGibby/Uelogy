'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

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
    link: { href: '/sales-ops/resources?tab=calc', label: 'Open Calculator' },
  },
  {
    keywords: ['panel', 'inverter', 'battery', 'powerwall', 'equipment', 'spec', 'warranty'],
    response: 'The Equipment Guide covers every SKU, warranty, and spec sheet.',
    link: { href: '/sales-ops/resources?tab=equipment', label: 'Open Equipment Guide' },
  },
  {
    keywords: ['contact', 'who do i', 'phone', 'call', 'email', 'hours', 'directory'],
    response: 'Ops teams, hours, phones, and emails are in the Contact Guide.',
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
    keywords: ['pulse', 'kpi', 'bookings', 'install', 'leaderboard', 'scorecard'],
    response: 'All leader-facing numbers live on Pulse.',
    link: { href: '/sales-ops/pulse', label: 'Open Pulse' },
  },
];

const COMMON_ASKS = [
  'Where are the adders?',
  'Who do I call for a deal question?',
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

export default function FeedbackWidget() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: uid(),
      from: 'bot',
      text: 'Hi. I\u2019m the Sales Ops shortcut. Ask me where something lives, or send a note \u2014 it goes to Sam.',
      ts: Date.now(),
    },
  ]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, open]);

  // Hide the floating widget on the auth page (/sales-ops exactly)
  if (!path || path === '/sales-ops') return null;

  async function submit(text: string) {
    if (!text.trim() || sending) return;
    setSending(true);
    const user: Message = { id: uid(), from: 'user', text: text.trim(), ts: Date.now() };
    setMessages(m => [...m, user]);
    setDraft('');

    const intent = matchIntent(text);
    await new Promise(r => setTimeout(r, 320));

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
    <>
      {/* Bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open feedback chat"
          style={{
            position: 'fixed',
            bottom: 22,
            right: 22,
            width: 54,
            height: 54,
            borderRadius: '50%',
            background: SUN,
            color: INK,
            border: 0,
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            fontFamily: SANS,
            fontSize: 22,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill={INK}/>
          </svg>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 22,
            right: 22,
            width: 'min(380px, calc(100vw - 44px))',
            height: 'min(560px, calc(100vh - 44px))',
            background: INK,
            color: TEXT_SOFT,
            fontFamily: SANS,
            border: `1px solid ${LINE_HI}`,
            borderRadius: 6,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            zIndex: 90,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, background: SUN, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Sales Ops shortcut</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.04em', marginTop: 2 }}>
                Ask or send a note
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 0,
                color: MUTED,
                cursor: 'pointer',
                fontSize: 18,
                padding: 4,
                lineHeight: 1,
              }}
            >
              {'\u2715'}
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, padding: '14px 14px', overflowY: 'auto' }}>
            {messages.map(m => <ChatRow key={m.id} m={m} />)}
            {sending && (
              <div style={{ padding: '6px 0', fontFamily: MONO, fontSize: 10, color: MUTED }}>
                Typing{'\u2026'}
              </div>
            )}

            {messages.length <= 1 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.04em', marginBottom: 8 }}>
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
                        padding: '8px 10px',
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
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); submit(draft); }}
            style={{ display: 'flex', gap: 6, padding: '10px 10px', borderTop: `1px solid ${LINE}`, background: SURFACE }}
          >
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a question\u2026"
              style={{
                flex: 1,
                padding: '9px 11px',
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
                padding: '9px 14px',
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 700,
                cursor: !draft.trim() || sending ? 'not-allowed' : 'pointer',
                opacity: !draft.trim() || sending ? 0.5 : 1,
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function ChatRow({ m }: { m: Message }) {
  const isUser = m.from === 'user';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      <div
        style={{
          background: isUser ? SUN : SURFACE_HI,
          color: isUser ? INK : TEXT_SOFT,
          padding: '8px 11px',
          maxWidth: '85%',
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
            padding: '7px 10px',
            background: 'transparent',
            border: `1px solid ${SUN}`,
            borderRadius: 4,
            color: SUN,
            fontFamily: SANS,
            fontSize: 11,
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
