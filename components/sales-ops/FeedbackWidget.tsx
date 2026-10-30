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
  ts: number;
}

const COMMON = [
  'Where are the adders?',
  'Who do I call for a deal question?',
  'What panels do we offer?',
  'How do I escalate a stuck install?',
];

function uid() { return Math.random().toString(36).slice(2); }

export default function FeedbackWidget() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: uid(), from: 'bot', text: 'Hi. I\u2019m the Sales Ops shortcut \u2014 ask me anything about Direct Ops, contacts, financing, equipment, or SLAs.', ts: Date.now() },
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

    try {
      const res = await fetch('/api/sales-ops/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: text.trim() }),
      });
      const payload = await res.json().catch(() => ({}));
      const answer = (payload?.answer as string | undefined)?.trim();
      if (res.ok && answer) {
        setMessages(m => [...m, { id: uid(), from: 'bot', text: answer, ts: Date.now() }]);
      } else {
        setMessages(m => [...m, { id: uid(), from: 'bot', text: 'Got it \u2014 I\u2019ll pass this along to Sam.', ts: Date.now() }]);
        void fetch('/api/sales-ops/feedback', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: text.trim(), ts: Date.now() }),
        }).catch(() => {});
      }
    } catch {
      setMessages(m => [...m, { id: uid(), from: 'bot', text: 'Chat is briefly offline. I logged your note for Sam.', ts: Date.now() }]);
      void fetch('/api/sales-ops/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), ts: Date.now() }),
      }).catch(() => {});
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Sales Ops chat"
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
              <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.14em', marginTop: 2, textTransform: 'uppercase' }}>Ask anything</div>
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
              <div style={{ padding: '6px 0', fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.14em' }}>Thinking{'\u2026'}</div>
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
          whiteSpace: 'pre-wrap',
        }}
      >
        {m.text}
      </div>
    </div>
  );
}
