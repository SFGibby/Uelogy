'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Link from 'next/link';

type Mode = 'in_appt' | 'about_to' | 'prepping' | 'router';
type MessageRole = 'user' | 'assistant' | 'human';

interface Msg {
  id?: string;
  role: MessageRole;
  content: string;
}

const MODES: {
  id: Mode;
  label: string;
  sub: string;
  opener: string;
  accent: string;
  severity: string;
}[] = [
  {
    id: 'in_appt',
    label: 'In Appointment!!!',
    sub: 'The customer is right here. Fast answer, no fluff.',
    opener: "I've got you. What's the question?",
    accent: 'var(--sp-danger)',
    severity: '!!!',
  },
  {
    id: 'about_to',
    label: 'About to be in an Appointment!!',
    sub: 'Minutes out. Two shots to get you ready.',
    opener: "Walk me through what you're walking into.",
    accent: 'var(--sp-warn)',
    severity: '!!',
  },
  {
    id: 'prepping',
    label: 'Prepping for an Appointment!',
    sub: "You've got time. I'll go deep.",
    opener: "Take your time. What are we working on?",
    accent: 'var(--sp-calm)',
    severity: '!',
  },
  {
    id: 'router',
    label: 'Help, I need somebody, not just anybody.',
    sub: 'Wayfinding — who owns what, where to find things.',
    opener: "Hit me with it. Who or what are you trying to find?",
    accent: 'var(--sp-router)',
    severity: '·',
  },
];

const PLEDGE_TEXT =
  'Are you actually in the home with the client? If not and we find out all your future requests will be de-prioritized.';

const SUPABASE_URL = 'https://zusoxekerqrvdlctbkcc.supabase.co';

export default function TriagePage() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'bot' | 'escalated' | 'taken_over'>('bot');
  const [showPledge, setShowPledge] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const pledgeRef = useRef<boolean>(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading]);

  const subscribe = useCallback((id: string) => {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const sb = createClient(SUPABASE_URL, anonKey);
    supabaseRef.current = sb;

    const msgCh = sb
      .channel(`triage-msgs-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'triage_messages',
          filter: `session_id=eq.${id}`,
        },
        (payload) => {
          const m = payload.new as { id: string; role: MessageRole; content: string };
          setMessages((prev) => {
            if (prev.some((p) => p.id === m.id)) return prev;
            return [...prev, { id: m.id, role: m.role, content: m.content }];
          });
        }
      )
      .subscribe();

    const sessCh = sb
      .channel(`triage-sess-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'triage_sessions',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const s = payload.new as { status: 'bot' | 'escalated' | 'taken_over' };
          setStatus(s.status);
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(msgCh);
      sb.removeChannel(sessCh);
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    return subscribe(sessionId);
  }, [sessionId, subscribe]);

  function pickMode(m: Mode) {
    if (m === 'in_appt') {
      setShowPledge(true);
      return;
    }
    startSession(m, false);
  }

  function startSession(m: Mode, pledgeConfirmed: boolean) {
    const selected = MODES.find((x) => x.id === m)!;
    pledgeRef.current = pledgeConfirmed;
    setMode(m);
    setShowPledge(false);
    setMessages([{ role: 'assistant', content: selected.opener }]);
    setTimeout(() => {
      document.getElementById('chat-panel')?.scrollIntoView({ behavior: 'smooth' });
    }, 30);
  }

  async function send() {
    const text = input.trim();
    if (!text || loading || !mode) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          mode: sessionId ? undefined : mode,
          pledgeConfirmed: sessionId ? undefined : pledgeRef.current,
          message: text,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Something broke: ${data.error || 'unknown'}`,
          },
        ]);
      } else {
        if (!sessionId) setSessionId(data.sessionId);
        if (data.escalated) setStatus('escalated');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Network error: ${err instanceof Error ? err.message : 'unknown'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const activeMode = mode ? MODES.find((m) => m.id === mode)! : null;

  return (
    <main>
      {showPledge && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className="sp-card"
            style={{
              maxWidth: 500,
              width: '100%',
              padding: 28,
              borderColor: 'rgba(255, 77, 77, 0.5)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: 'var(--sp-danger)',
                fontWeight: 700,
                marginBottom: 14,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Before you go in
            </div>
            <p style={{ fontSize: 17, lineHeight: 1.5, margin: 0, color: 'var(--sp-text-hi)' }}>
              {PLEDGE_TEXT}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setShowPledge(false)}
                className="sp-btn sp-btn-ghost"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                onClick={() => startSession('in_appt', true)}
                className="sp-btn"
                style={{ flex: 1, background: 'var(--sp-danger)' }}
              >
                I am in the home
              </button>
            </div>
          </div>
        </div>
      )}

      <section style={{ position: 'relative', padding: '72px 0 48px', overflow: 'hidden' }}>
        <div className="sp-mesh" />
        <div className="sp-grid" />
        <div className="sp-container">
          <div className="sp-eyebrow">Sales Operations · Pre-sale support</div>
          <h1 className="sp-h1">
            Your in-appointment
            <br />
            <span style={{ color: 'var(--sp-blue-soft)' }}>
              backup.
            </span>
          </h1>
          <p className="sp-lead">
            Pick a lane. The bot matches tempo, answers from the knowledge base, and
            loops Sam in if it doesn&apos;t have the answer — no forms, no friction.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 14,
              marginTop: 36,
              position: 'relative',
              zIndex: 3,
            }}
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => pickMode(m.id)}
                className="sp-card"
                style={{
                  textAlign: 'left',
                  padding: '20px 20px 22px',
                  cursor: 'pointer',
                  borderLeft: `3px solid ${m.accent}`,
                  color: 'inherit',
                  fontFamily: 'inherit',
                  transition: 'transform 0.12s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: m.accent,
                      letterSpacing: '0.1em',
                    }}
                  >
                    {m.severity}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--sp-text-lo)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    lane
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--sp-text-hi)',
                    lineHeight: 1.25,
                  }}
                >
                  {m.label}
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    color: 'var(--sp-text-md)',
                    marginTop: 8,
                    lineHeight: 1.45,
                  }}
                >
                  {m.sub}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {mode && (
        <section id="chat-panel" className="sp-section" style={{ paddingTop: 24 }}>
          <div className="sp-container">
            <div
              className="sp-card"
              style={{
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 480,
              }}
            >
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--sp-ink-3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 10,
                    background: activeMode!.accent,
                    boxShadow: `0 0 12px ${activeMode!.accent}`,
                  }}
                />
                <span
                  style={{
                    fontSize: 14,
                    color: 'var(--sp-text-hi)',
                    fontWeight: 600,
                  }}
                >
                  {activeMode!.label}
                </span>
                {status === 'escalated' && (
                  <span
                    className="sp-badge"
                    style={{
                      color: 'var(--sp-warn)',
                      borderColor: 'rgba(240, 160, 64, 0.4)',
                      background: 'rgba(240, 160, 64, 0.12)',
                    }}
                  >
                    Escalated · Sam notified
                  </span>
                )}
                {status === 'taken_over' && (
                  <span
                    className="sp-badge sp-badge-blue"
                    style={{
                      color: '#9fd89f',
                      borderColor: 'rgba(47, 122, 47, 0.4)',
                      background: 'rgba(47, 122, 47, 0.12)',
                    }}
                  >
                    Sam is responding
                  </span>
                )}
                <button
                  onClick={() => {
                    setMode(null);
                    setSessionId(null);
                    setMessages([]);
                    setStatus('bot');
                  }}
                  className="sp-btn sp-btn-ghost"
                  style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 12 }}
                >
                  Change lane
                </button>
              </div>

              <div
                ref={scrollRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 20px',
                  minHeight: 320,
                  maxHeight: 520,
                }}
              >
                {messages.map((m, i) => (
                  <div
                    key={m.id ?? i}
                    style={{
                      display: 'flex',
                      justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                      margin: '10px 0',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '82%',
                        background:
                          m.role === 'user'
                            ? 'var(--sp-blue)'
                            : m.role === 'human'
                              ? 'rgba(47, 122, 47, 0.18)'
                              : 'var(--sp-ink-2)',
                        border: `1px solid ${
                          m.role === 'user'
                            ? 'transparent'
                            : m.role === 'human'
                              ? 'rgba(47, 122, 47, 0.4)'
                              : 'var(--sp-ink-3)'
                        }`,
                        color: m.role === 'user' ? '#fff' : 'var(--sp-text-hi)',
                        padding: '10px 14px',
                        borderRadius: 12,
                        fontSize: 15,
                        lineHeight: 1.55,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.role === 'human' && (
                        <div
                          style={{
                            fontSize: 11,
                            color: '#9fd89f',
                            marginBottom: 3,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                          }}
                        >
                          Sam
                        </div>
                      )}
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ color: 'var(--sp-text-lo)', fontSize: 13, margin: '8px 4px' }}>
                    thinking…
                  </div>
                )}
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--sp-ink-3)',
                  padding: '14px 16px',
                  background: 'rgba(5, 7, 12, 0.6)',
                  display: 'flex',
                  gap: 8,
                }}
              >
                <input
                  placeholder="Talk to me."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    background: 'var(--sp-ink-2)',
                    border: '1px solid var(--sp-ink-4)',
                    color: 'var(--sp-text-hi)',
                    borderRadius: 8,
                    fontSize: 15,
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className="sp-btn"
                  style={{
                    opacity: loading || !input.trim() ? 0.5 : 1,
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="sp-section" style={{ paddingTop: mode ? 0 : 48 }}>
        <div className="sp-container">
          <div className="sp-eyebrow">Also on this site</div>
          <h2 className="sp-h2">If you&apos;d rather browse</h2>
          <p className="sp-body" style={{ maxWidth: 520 }}>
            The bot pulls from these same pages. Hand the links to reps who need to see it all at once.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 14,
              marginTop: 24,
            }}
          >
            <LinkCard
              href="/triage/faq"
              title="FAQ"
              body="Common pre-sale questions, answered by product line and deal stage."
            />
            <LinkCard
              href="/triage/directory"
              title="Directory"
              body="Who owns what. Escalation targets, team leads, support functions."
            />
            <LinkCard
              href="/triage/reference"
              title="Reference"
              body="Quick-hit cheatsheet — warranties, install requirements, common objections."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function LinkCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="sp-card"
      style={{
        padding: 20,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.12s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--sp-blue)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--sp-ink-3)';
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <h3 className="sp-h3">{title}</h3>
        <span style={{ color: 'var(--sp-blue)', fontSize: 18 }}>→</span>
      </div>
      <p className="sp-body" style={{ margin: 0 }}>{body}</p>
    </Link>
  );
}
