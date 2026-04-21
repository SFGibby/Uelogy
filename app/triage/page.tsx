'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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
}[] = [
  {
    id: 'in_appt',
    label: 'In Appointment!!!',
    sub: 'The customer is right here. Fast answer, no fluff.',
    opener: "I've got you. What's the question?",
    accent: '#ff4d4d',
  },
  {
    id: 'about_to',
    label: 'About to be in an Appointment!!',
    sub: 'Minutes out. Two shots to get you ready.',
    opener: "Walk me through what you're walking into.",
    accent: '#f0a040',
  },
  {
    id: 'prepping',
    label: 'Prepping for an Appointment!',
    sub: "You've got time. I'll go deep.",
    opener: "Take your time. What are we working on?",
    accent: '#58a6ff',
  },
  {
    id: 'router',
    label: 'Help, I need somebody, not just anybody.',
    sub: 'Wayfinding — who owns what, where to find things.',
    opener: "Hit me with it. Who or what are you trying to find?",
    accent: '#b48cff',
  },
];

const PLEDGE_TEXT =
  'Are you actually in the home with the client? If not and we find out all your future requests will be de-prioritized.';

const SUPABASE_URL = 'https://zusoxekerqrvdlctbkcc.supabase.co';

export default function Triage() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'bot' | 'escalated' | 'taken_over'>('bot');
  const [showPledge, setShowPledge] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);

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
    const cleanup = subscribe(sessionId);
    return cleanup;
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
    setMode(m);
    setShowPledge(false);
    setMessages([{ role: 'assistant', content: selected.opener }]);
    // pledge flag carried until first send
    (startSession as unknown as { _pledge?: boolean })._pledge = pledgeConfirmed;
  }

  async function send() {
    const text = input.trim();
    if (!text || loading || !mode) return;
    const optimistic: Msg = { role: 'user', content: text };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setLoading(true);

    try {
      const pledge = (startSession as unknown as { _pledge?: boolean })._pledge === true;
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          mode: sessionId ? undefined : mode,
          pledgeConfirmed: sessionId ? undefined : pledge,
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
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#0b0b0d',
        color: '#eee',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {showPledge && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#17171a',
              border: '1px solid #ff4d4d66',
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: '100%',
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: '#ff4d4d',
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Before you go in —
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.5, margin: 0 }}>
              {PLEDGE_TEXT}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setShowPledge(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid #333',
                  color: '#aaa',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Back
              </button>
              <button
                onClick={() => startSession('in_appt', true)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ff4d4d',
                  border: 'none',
                  color: '#0b0b0d',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                I am in the home
              </button>
            </div>
          </div>
        </div>
      )}

      {!mode ? (
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            padding: '48px 24px',
            width: '100%',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
            Hey. What do you need?
          </h1>
          <p style={{ color: '#9a9a9a', fontSize: 15, marginTop: 8 }}>
            Pick a lane. I'll match the tempo.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
              marginTop: 24,
            }}
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => pickMode(m.id)}
                style={{
                  textAlign: 'left',
                  background: '#131316',
                  border: `1px solid ${m.accent}44`,
                  borderLeft: `3px solid ${m.accent}`,
                  borderRadius: 10,
                  padding: '18px',
                  color: '#eee',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1b1b20';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#131316';
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: m.accent,
                  }}
                >
                  {m.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#9a9a9a',
                    marginTop: 4,
                    lineHeight: 1.45,
                  }}
                >
                  {m.sub}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              maxWidth: '760px',
              width: '100%',
              margin: '0 auto',
              padding: '20px 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 8,
                background: activeMode!.accent,
              }}
            />
            <div style={{ fontSize: 13, color: '#9a9a9a' }}>
              {activeMode!.label}
            </div>
            {status === 'escalated' && (
              <div
                style={{
                  fontSize: 12,
                  color: '#f0c040',
                  padding: '2px 8px',
                  background: '#2a230a',
                  borderRadius: 6,
                }}
              >
                escalated — Sam notified
              </div>
            )}
            {status === 'taken_over' && (
              <div
                style={{
                  fontSize: 12,
                  color: '#9fd89f',
                  padding: '2px 8px',
                  background: '#1a2a1a',
                  borderRadius: 6,
                }}
              >
                Sam is responding
              </div>
            )}
            <button
              onClick={() => {
                setMode(null);
                setSessionId(null);
                setMessages([]);
                setStatus('bot');
              }}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: '1px solid #333',
                color: '#888',
                padding: '4px 10px',
                fontSize: 12,
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              change lane
            </button>
          </div>

          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              maxWidth: '760px',
              width: '100%',
              margin: '0 auto',
              padding: '12px 20px',
            }}
          >
            {messages.map((m, i) => (
              <div
                key={m.id ?? i}
                style={{
                  display: 'flex',
                  justifyContent:
                    m.role === 'user' ? 'flex-end' : 'flex-start',
                  margin: '8px 0',
                }}
              >
                <div
                  style={{
                    maxWidth: '82%',
                    background:
                      m.role === 'user'
                        ? '#1f2937'
                        : m.role === 'human'
                          ? '#1a2a1a'
                          : '#141417',
                    border: `1px solid ${
                      m.role === 'user'
                        ? '#2a3a4a'
                        : m.role === 'human'
                          ? '#2f4a2f'
                          : '#232326'
                    }`,
                    padding: '10px 14px',
                    borderRadius: 12,
                    fontSize: 15,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.role === 'human' && (
                    <div
                      style={{
                        fontSize: 11,
                        color: '#6a8a6a',
                        marginBottom: 3,
                        letterSpacing: '0.04em',
                      }}
                    >
                      SAM
                    </div>
                  )}
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ color: '#666', fontSize: 13, margin: '8px 4px' }}>
                thinking…
              </div>
            )}
          </div>

          <div
            style={{
              borderTop: '1px solid #1d1d20',
              padding: '12px 20px',
              background: '#0a0a0c',
            }}
          >
            <div
              style={{
                maxWidth: '760px',
                margin: '0 auto',
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
                  background: '#151518',
                  border: '1px solid #2a2a2e',
                  color: '#eee',
                  borderRadius: 8,
                  fontSize: 15,
                }}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                style={{
                  padding: '12px 18px',
                  background: loading ? '#2a2a2e' : activeMode!.accent,
                  border: 'none',
                  color: '#0b0b0d',
                  borderRadius: 8,
                  cursor: loading ? 'default' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
