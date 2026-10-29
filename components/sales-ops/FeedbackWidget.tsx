'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

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
  { keywords: ['adder', 'adders'], response: 'Adders Guide has every option by financier.', link: { href: '/sales-ops/resources?tab=adders', label: 'Open Adders Guide' } },
  { keywords: ['finance', 'financier', 'lender', 'loan', 'ppa', 'lease'], response: 'Finance Resource Guide \u2014 full lender matrix.', link: { href: '/sales-ops/resources?tab=finance', label: 'Open Finance Guide' } },
  { keywords: ['calc', 'calculator', 'payment', 'monthly'], response: 'Financing Calculator estimates monthly payment by lender.', link: { href: '/sales-ops/resources?tab=calc', label: 'Open Calculator' } },
  { keywords: ['panel', 'inverter', 'battery', 'powerwall', 'equipment', 'spec', 'warranty'], response: 'Equipment Guide: every SKU, warranty, spec.', link: { href: '/sales-ops/resources?tab=equipment', label: 'Open Equipment Guide' } },
  { keywords: ['contact', 'phone', 'call', 'email', 'hours', 'directory'], response: 'Ops contacts, hours, emails are in the Contact Guide.', link: { href: '/sales-ops/resources?tab=sales', label: 'Open Contact Guide' } },
  { keywords: ['faq', 'faqs'], response: 'FAQ covers the common questions.', link: { href: '/sales-ops/resources?tab=faqs', label: 'Open FAQs' } },
  { keywords: ['map', 'install speed', 'zip', 'state'], response: 'Install-speed map on the Map tab.', link: { href: '/sales-ops/map', label: 'Open Map' } },
  { keywords: ['pulse', 'kpi', 'bookings', 'leaderboard', 'scorecard'], response: 'Leader numbers live on Pulse.', link: { href: '/sales-ops/pulse', label: 'Open Pulse' } },
];

const COMMON = [
  'Where are the adders?',
  'Who do I call for a deal question?',
  'Where is the leaderboard?',
];

function matchIntent(text: string): Intent | null {
  const t = text.toLowerCase();
  for (const intent of INTENTS) for (const kw of intent.keywords) if (t.includes(kw)) return intent;
  return null;
}

function uid() { return Math.random().toString(36).slice(2); }

export default function FeedbackWidget() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: uid(), from: 'bot', text: 'Ask me where something lives \u2014 or send a note.', ts: Date.now() },
  ]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

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
      setMessages(m => [...m, { id: uid(), from: 'bot', text: 'Got it \u2014 passing it to Sam.', ts: Date.now() }]);
      void fetch('/api/sales-ops/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: text.trim(), ts: Date.now() }) }).catch(() => {});
    }
    setSending(false);
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open feedback chat"
          style={{
            position: 'fixed',
            bottom: 24, right: 24,
            width: 60, height: 60,
            borderRadius: '50%',
            background: SUN,
            color: INK,
            border: 0,
            cursor: 'pointer',
            boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 90,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill={INK}/>
          </svg>
        </button>
      )}

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 24, right: 24,
            width: 'min(400px, calc(100vw - 48px))',
            height: 'min(580px, calc(100vh - 48px))',
            background: INK,
            color: TEXT,
            fontFamily: SANS,
            border: `1px solid ${LINE_HI}`,
            borderRadius: 14,
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 28px 70px rgba(0,0,0,0.6)',
            zIndex: 90,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: SUN, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT }}>Sales Ops shortcut</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.14em', marginTop: 2, textTransform: 'uppercase' }}>Ask or note</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{ background: 'transparent', border: 0, color: MUTED, cursor: 'pointer', fontSize: 18, padding: 6, lineHeight: 1 }}
            >
              {'\u2715'}
            </button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, padding: '14px 16px', overflowY: 'auto' }}>
            {messages.map(m => <ChatRow key={m.id} m={m} />)}
            {sending && (
              <div style={{ padding: '6px 0', fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.14em' }}>Typing{'\u2026'}</div>
            )}

            {messages.length <= 1 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.22em', marginBottom: 10, textTransform: 'uppercase' }}>Common asks</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {COMMON.map(q => (
                    <button
                      key={q}
                      onClick={() => submit(q)}
                      disabled={sending}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        background: 'transparent',
                        border: `1px solid ${LINE_HI}`,
                        borderRadius: 10,
                        color: SUBTLE,
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
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); submit(draft); }}
            style={{ display: 'flex', gap: 8, padding: '12px 12px', borderTop: `1px solid ${LINE}`, background: SURFACE }}
          >
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a question"
              style={{
                flex: 1,
                padding: '10px 14px',
                background: INK,
                color: TEXT,
                border: `1px solid ${LINE_HI}`,
                borderRadius: 999,
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
                borderRadius: 999,
                padding: '10px 18px',
                fontFamily: DISPLAY,
                fontSize: 12,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
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
          color: isUser ? INK : TEXT,
          padding: '10px 14px',
          maxWidth: '85%',
          fontSize: 13,
          lineHeight: 1.5,
          borderRadius: 12,
        }}
      >
        {m.text}
      </div>
      {m.link && !isUser && (
        <a
          href={m.link.href}
          style={{
            marginTop: 6,
            padding: '8px 14px',
            background: 'transparent',
            border: `1px solid ${SUN}`,
            borderRadius: 999,
            color: SUN,
            fontFamily: DISPLAY,
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
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
