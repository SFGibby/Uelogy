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
  image_url?: string | null;
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
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showResolvedToast, setShowResolvedToast] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const pledgeRef = useRef<boolean>(false);

  useEffect(() => {
    if (mode) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 150);
      return () => window.clearTimeout(t);
    }
  }, [mode]);

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
          const m = payload.new as {
            id: string;
            role: MessageRole;
            content: string;
            image_url?: string | null;
          };
          setMessages((prev) => {
            if (prev.some((p) => p.id === m.id)) return prev;
            return [
              ...prev,
              { id: m.id, role: m.role, content: m.content, image_url: m.image_url ?? null },
            ];
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

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/triage/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'upload failed');
      setPendingImage(data.url);
    } catch (err) {
      alert(`Upload failed: ${err instanceof Error ? err.message : 'unknown'}`);
    } finally {
      setUploading(false);
    }
  }

  async function markResolved() {
    if (!sessionId || loading) return;
    try {
      await fetch('/api/triage/takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'rep_resolved',
          heliosSolved: status !== 'taken_over',
        }),
      });
    } catch {
      /* ignore */
    }
    setShowResolvedToast(true);
    setTimeout(() => {
      setMode(null);
      setSessionId(null);
      setMessages([]);
      setStatus('bot');
      setPendingImage(null);
      setShowResolvedToast(false);
    }, 1200);
  }

  async function send() {
    const text = input.trim();
    if ((!text && !pendingImage) || loading || !mode) return;
    const imgToSend = pendingImage;
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text, image_url: imgToSend },
    ]);
    setInput('');
    setPendingImage(null);
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
          imageUrl: imgToSend,
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
      {showResolvedToast && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(26, 42, 26, 0.96)',
            border: '1px solid #2f4a2f',
            padding: '18px 24px',
            borderRadius: 12,
            color: '#9fd89f',
            fontWeight: 600,
            zIndex: 200,
            backdropFilter: 'blur(6px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          }}
        >
          Resolved. Pick a new lane when ready.
        </div>
      )}
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
            hands off to a human when it&apos;s stuck — no forms, no friction.
          </p>

          <div
            className="sp-lane-grid"
            style={{
              marginTop: 32,
              position: 'relative',
              zIndex: 3,
            }}
          >
            {MODES.map((m) => (
              <LaneCard key={m.id} mode={m} onClick={() => pickMode(m.id)} />
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
                <AgentBadge active={status !== 'taken_over'} />
                <span
                  style={{
                    width: 1,
                    height: 18,
                    background: 'var(--sp-ink-4)',
                    margin: '0 4px',
                  }}
                />
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
                    {m.role !== 'user' && <AgentAvatar role={m.role} />}
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
                      {m.role !== 'user' && (
                        <div
                          style={{
                            fontSize: 11,
                            color:
                              m.role === 'human' ? '#9fd89f' : 'var(--sp-blue-soft)',
                            marginBottom: 4,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                          }}
                        >
                          {m.role === 'human' ? 'Sam · Human' : 'Helios'}
                        </div>
                      )}
                      {m.image_url && (
                        <a
                          href={m.image_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'block', marginBottom: m.content ? 8 : 0 }}
                        >
                          <img
                            src={m.image_url}
                            alt="upload"
                            style={{
                              maxWidth: '100%',
                              maxHeight: 240,
                              borderRadius: 8,
                              display: 'block',
                            }}
                          />
                        </a>
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
                  padding: '12px 14px',
                  background: 'rgba(5, 7, 12, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {pendingImage && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      background: 'var(--sp-ink-2)',
                      border: '1px solid var(--sp-ink-4)',
                      borderRadius: 8,
                    }}
                  >
                    <img
                      src={pendingImage}
                      alt="preview"
                      style={{
                        width: 44,
                        height: 44,
                        objectFit: 'cover',
                        borderRadius: 6,
                      }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--sp-text-md)' }}>
                      Image attached
                    </span>
                    <button
                      onClick={() => setPendingImage(null)}
                      style={{
                        marginLeft: 'auto',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--sp-text-lo)',
                        cursor: 'pointer',
                        fontSize: 16,
                        fontWeight: 700,
                        padding: '4px 8px',
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadImage(f);
                      if (fileRef.current) fileRef.current.value = '';
                    }}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading || loading}
                    aria-label="Attach image"
                    className="sp-btn sp-btn-ghost"
                    style={{ padding: '0 12px', minWidth: 44 }}
                  >
                    {uploading ? '…' : '+'}
                  </button>
                  <input
                    ref={inputRef}
                    placeholder={pendingImage ? 'Add a note (optional)…' : 'Talk to me.'}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    disabled={loading}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      background: 'var(--sp-ink-2)',
                      border: '1px solid var(--sp-ink-4)',
                      color: 'var(--sp-text-hi)',
                      borderRadius: 8,
                      fontSize: 16,
                      fontFamily: 'inherit',
                      outline: 'none',
                      WebkitAppearance: 'none',
                      minWidth: 0,
                    }}
                  />
                  <button
                    onClick={send}
                    disabled={loading || (!input.trim() && !pendingImage)}
                    className="sp-btn"
                    style={{
                      opacity: loading || (!input.trim() && !pendingImage) ? 0.5 : 1,
                    }}
                  >
                    Send
                  </button>
                  <button
                    onClick={markResolved}
                    disabled={loading || !sessionId}
                    aria-label="Mark chat resolved"
                    className="sp-btn"
                    title="Mark this chat resolved"
                    style={{
                      background: 'rgba(74, 138, 74, 0.2)',
                      color: '#9fd89f',
                      border: '1px solid rgba(74, 138, 74, 0.4)',
                      padding: '0 12px',
                      minWidth: 44,
                      opacity: loading || !sessionId ? 0.5 : 1,
                    }}
                  >
                    ✓
                  </button>
                </div>
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

function LaneCard({
  mode,
  onClick,
}: {
  mode: (typeof MODES)[number];
  onClick: () => void;
}) {
  const [tipOpen, setTipOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  const cancelHold = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (!tipOpen) return;
    const close = (e: Event) => {
      if (
        e.target instanceof Element &&
        e.target.closest(`[data-tip-for="${mode.id}"]`)
      )
        return;
      setTipOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [tipOpen, mode.id]);

  const startHold = (e: React.TouchEvent) => {
    e.stopPropagation();
    cancelHold();
    timerRef.current = window.setTimeout(() => setTipOpen(true), 450);
  };

  return (
    <button
      onClick={onClick}
      className="sp-card sp-lane-card"
      style={{
        borderLeft: `3px solid ${mode.accent}`,
      }}
    >
      <span
        data-tip-for={mode.id}
        onMouseEnter={() => setTipOpen(true)}
        onMouseLeave={() => setTipOpen(false)}
        onTouchStart={startHold}
        onTouchEnd={(e) => {
          e.stopPropagation();
          cancelHold();
        }}
        onTouchCancel={(e) => {
          e.stopPropagation();
          cancelHold();
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
          cancelHold();
        }}
        onClick={(e) => e.stopPropagation()}
        className="sp-tip-trigger sp-tip-corner"
        role="button"
        aria-label="What does this lane mean?"
      >
        ?
      </span>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: mode.accent,
          letterSpacing: '0.06em',
          marginBottom: 8,
        }}
      >
        {mode.severity}
      </div>
      <div className="sp-lane-title">{mode.label}</div>
      {tipOpen && (
        <div
          data-tip-for={mode.id}
          className="sp-tip-bubble"
          role="tooltip"
        >
          {mode.sub}
        </div>
      )}
    </button>
  );
}

function AgentAvatar({ role }: { role: 'assistant' | 'human' }) {
  const isBot = role === 'assistant';
  return (
    <div
      style={{
        flexShrink: 0,
        width: 34,
        height: 34,
        borderRadius: isBot ? 10 : 34,
        background: isBot
          ? 'linear-gradient(135deg, var(--sp-blue) 0%, #1a6ed0 100%)'
          : 'linear-gradient(135deg, #3a6b3a 0%, #4a8a4a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        marginTop: 2,
        boxShadow: isBot
          ? '0 0 16px rgba(0, 86, 184, 0.35)'
          : '0 0 12px rgba(74, 138, 74, 0.3)',
      }}
      aria-label={isBot ? 'Helios' : 'Sam'}
    >
      <img
        src={isBot ? '/sunpower/helios-plane.svg' : '/sunpower/person.svg'}
        alt=""
        style={{
          width: isBot ? 26 : 20,
          height: isBot ? 26 : 20,
          color: '#fff',
          filter: 'brightness(0) invert(1)',
        }}
      />
    </div>
  );
}

function AgentBadge({ active }: { active: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: active ? 7 : 26,
          background: active
            ? 'linear-gradient(135deg, var(--sp-blue) 0%, #1a6ed0 100%)'
            : 'linear-gradient(135deg, #3a6b3a 0%, #4a8a4a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={active ? '/sunpower/helios-plane.svg' : '/sunpower/person.svg'}
          alt=""
          style={{
            width: active ? 20 : 15,
            height: active ? 20 : 15,
            filter: 'brightness(0) invert(1)',
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--sp-text-hi)',
          }}
        >
          {active ? 'Helios' : 'Sam'}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'var(--sp-text-lo)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {active ? 'AI · responding' : 'Human · in the chat'}
        </span>
      </div>
    </div>
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
