'use client';
import { useState, useEffect, useRef, useCallback, use } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSearchParams } from 'next/navigation';

type MessageRole = 'user' | 'assistant' | 'human';
interface Msg {
  id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}
interface Session {
  id: string;
  mode: string;
  status: 'bot' | 'escalated' | 'taken_over' | 'closed';
  bucket: string | null;
  urgency: string | null;
  attempts: number;
  pledge_confirmed: boolean;
}

const SUPABASE_URL = 'https://zusoxekerqrvdlctbkcc.supabase.co';

export default function TakeOverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/triage/session/${id}?token=${encodeURIComponent(token)}`
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'failed to load');
      return;
    }
    setSession(data.session);
    setMessages(data.messages);
  }, [id, token]);

  useEffect(() => {
    if (!token) {
      setError('missing token');
      return;
    }
    load();
  }, [load, token]);

  useEffect(() => {
    if (!session) return;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const sb = createClient(SUPABASE_URL, anonKey);
    const msgCh = sb
      .channel(`to-msgs-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'triage_messages',
          filter: `session_id=eq.${id}`,
        },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => {
            if (prev.some((p) => p.id === m.id)) return prev;
            return [...prev, m];
          });
        }
      )
      .subscribe();
    const sessCh = sb
      .channel(`to-sess-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'triage_sessions',
          filter: `id=eq.${id}`,
        },
        (payload) => setSession(payload.new as Session)
      )
      .subscribe();
    return () => {
      sb.removeChannel(msgCh);
      sb.removeChannel(sessCh);
    };
  }, [session, id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  async function takeOver() {
    const res = await fetch('/api/triage/takeover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: id, token, action: 'take_over' }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'take over failed');
    }
  }

  async function reply() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      const res = await fetch('/api/triage/takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: id,
          token,
          action: 'reply',
          content: text,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'reply failed');
      }
    } finally {
      setSending(false);
    }
  }

  async function close() {
    if (!confirm('Mark this session closed?')) return;
    await fetch('/api/triage/takeover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: id, token, action: 'close' }),
    });
  }

  if (error)
    return (
      <main style={pageStyle}>
        <div style={{ padding: 40, color: '#f66', maxWidth: 680, margin: '0 auto' }}>
          {error}
        </div>
      </main>
    );
  if (!session)
    return (
      <main style={pageStyle}>
        <div style={{ padding: 40, color: '#888' }}>loading…</div>
      </main>
    );

  const statusColor =
    session.status === 'taken_over'
      ? '#9fd89f'
      : session.status === 'escalated'
        ? '#f0c040'
        : session.status === 'closed'
          ? '#888'
          : '#58a6ff';

  return (
    <main style={pageStyle}>
      <div
        style={{
          maxWidth: '760px',
          width: '100%',
          margin: '0 auto',
          padding: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20 }}>Takeover</h1>
          <span
            style={{
              fontSize: 12,
              color: statusColor,
              padding: '2px 8px',
              background: '#1a1a1d',
              borderRadius: 6,
            }}
          >
            {session.status}
          </span>
          <span style={{ fontSize: 12, color: '#888' }}>
            lane: {session.mode} · attempts: {session.attempts}
            {session.bucket && ` · bucket: ${session.bucket}`}
            {session.urgency && ` · ${session.urgency}`}
            {session.mode === 'in_appt' && (
              <> · pledge: {session.pledge_confirmed ? 'yes' : 'no'}</>
            )}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {session.status !== 'taken_over' && session.status !== 'closed' && (
              <button onClick={takeOver} style={btnPrimary}>
                I&apos;ll take it from here
              </button>
            )}
            {session.status !== 'closed' && (
              <button onClick={close} style={btnGhost}>
                close
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          maxWidth: '760px',
          width: '100%',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-start' : 'flex-end',
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
              <div
                style={{
                  fontSize: 11,
                  color: '#666',
                  marginBottom: 3,
                  letterSpacing: '0.04em',
                }}
              >
                {m.role === 'user' ? 'REP' : m.role === 'human' ? 'YOU' : 'BOT'}
              </div>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      {session.status === 'taken_over' && (
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
              placeholder="Reply to the rep…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  reply();
                }
              }}
              disabled={sending}
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
              onClick={reply}
              disabled={sending || !input.trim()}
              style={{
                ...btnPrimary,
                background: sending ? '#2a2a2e' : '#2a6',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
      {session.status === 'escalated' && (
        <div
          style={{
            padding: '14px 20px',
            maxWidth: 760,
            margin: '0 auto',
            color: '#aaa',
            fontSize: 13,
          }}
        >
          Rep is still chatting with the bot. Click{' '}
          <strong style={{ color: '#eee' }}>"I'll take it from here"</strong> to
          pause the bot and take over.
        </div>
      )}
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  background: '#0b0b0d',
  color: '#eee',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  minHeight: '100vh',
};

const btnPrimary: React.CSSProperties = {
  padding: '8px 14px',
  background: '#2a6',
  border: 'none',
  color: '#0b0b0d',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const btnGhost: React.CSSProperties = {
  padding: '8px 14px',
  background: 'transparent',
  border: '1px solid #333',
  color: '#aaa',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 13,
};
