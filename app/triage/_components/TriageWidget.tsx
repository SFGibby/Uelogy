'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type Mode = 'in_appt' | 'about_to' | 'prepping' | 'router';
type MessageRole = 'user' | 'assistant' | 'human';
type Status = 'bot' | 'escalated' | 'taken_over';

interface Msg {
  id?: string;
  role: MessageRole;
  content: string;
  image_url?: string | null;
}

function renderInline(text: string) {
  return text.split(/(\*[^*\n]+\*)/g).map((part, i) => {
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} style={{ fontStyle: 'italic', opacity: 0.8 }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const MODES: {
  id: Mode;
  label: string;
  placeholder: string;
  accent: string;
  severity: string;
}[] = [
  { id: 'in_appt', label: 'In Appointment!!!', placeholder: "What's the question?", accent: 'var(--sp-danger)', severity: '!!!' },
  { id: 'about_to', label: 'About to be!!', placeholder: "What are you walking into?", accent: 'var(--sp-warn)', severity: '!!' },
  { id: 'prepping', label: 'Prepping!', placeholder: "What are we working on?", accent: 'var(--sp-calm)', severity: '!' },
  { id: 'router', label: 'Need somebody.', placeholder: "Who or what are you trying to find?", accent: 'var(--sp-router)', severity: '·' },
];

const SUPABASE_URL = 'https://zusoxekerqrvdlctbkcc.supabase.co';
const PLEDGE_TEXT =
  'Are you actually in the home with the client? If not and we find out all your future requests will be de-prioritized.';
const STORAGE_KEY = 'triage_widget_session_v1';

interface StoredState {
  sessionId: string;
  mode: Mode;
}

export default function TriageWidget() {
  const pathname = usePathname();
  const hiddenRoute =
    pathname === '/triage' ||
    pathname.startsWith('/triage/take-over') ||
    pathname.startsWith('/triage/brainstorm');

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>('bot');
  const [showPledge, setShowPledge] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const pledgeRef = useRef<boolean>(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredState;
        if (parsed.sessionId && parsed.mode) {
          setSessionId(parsed.sessionId);
          setMode(parsed.mode);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist session + mode
  useEffect(() => {
    if (sessionId && mode) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sessionId, mode })
      );
    }
  }, [sessionId, mode]);

  // Hydrate messages when a restored session exists
  useEffect(() => {
    if (!sessionId || messages.length > 0) return;
    (async () => {
      try {
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const sb = createClient(SUPABASE_URL, anonKey);
        const { data } = await sb
          .from('triage_messages')
          .select('id, role, content, image_url')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
        if (data) {
          setMessages(
            data.map((m) => ({
              id: m.id as string,
              role: m.role as MessageRole,
              content: m.content as string,
              image_url: m.image_url as string | null,
            }))
          );
        }
        const { data: sess } = await sb
          .from('triage_sessions')
          .select('status, resolved')
          .eq('id', sessionId)
          .single();
        if (sess?.resolved) {
          clearSession();
        } else if (sess?.status) {
          setStatus(sess.status as Status);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [sessionId, messages.length]);

  const subscribe = useCallback((id: string) => {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const sb = createClient(SUPABASE_URL, anonKey);
    supabaseRef.current = sb;
    const msgCh = sb
      .channel(`tw-msgs-${id}`)
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
      .channel(`tw-sess-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'triage_sessions',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const s = payload.new as { status: Status; resolved: boolean };
          setStatus(s.status);
          if (s.resolved) clearSession();
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

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading]);

  function clearSession() {
    setSessionId(null);
    setMode(null);
    setMessages([]);
    setStatus('bot');
    setPendingImage(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  function pickMode(m: Mode) {
    if (m === 'in_appt') {
      setShowPledge(true);
      return;
    }
    startSession(m, false);
  }

  function startSession(m: Mode, pledgeConfirmed: boolean) {
    pledgeRef.current = pledgeConfirmed;
    setMode(m);
    setShowPledge(false);
    setMessages([]);
    setTimeout(() => inputRef.current?.focus(), 60);
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
    if (!sessionId) return;
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
    clearSession();
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

  if (hiddenRoute) return null;

  const activeMode = mode ? MODES.find((m) => m.id === mode) : null;
  const heliosStatus: 'waiting' | 'thinking' | 'transferring' = loading
    ? 'thinking'
    : status === 'escalated'
      ? 'transferring'
      : 'waiting';
  const isBot = status !== 'taken_over';

  return (
    <>
      {showPledge && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 250,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className="sp-card"
            style={{
              maxWidth: 420,
              padding: 22,
              borderColor: 'rgba(255, 77, 77, 0.5)',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: 'var(--sp-danger)',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Before you go in
            </div>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.5,
                marginTop: 10,
                marginBottom: 18,
                color: 'var(--sp-text-hi)',
              }}
            >
              {PLEDGE_TEXT}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="sp-btn sp-btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setShowPledge(false)}
              >
                Back
              </button>
              <button
                className="sp-btn"
                style={{ flex: 1, background: 'var(--sp-danger)' }}
                onClick={() => startSession('in_appt', true)}
              >
                I am in the home
              </button>
            </div>
          </div>
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Helios"
          className="sp-widget-fab"
        >
          <img
            src="/sunpower/helios-plane.svg"
            alt=""
            style={{ width: 38, height: 22, filter: 'brightness(0) invert(1)' }}
          />
          {status === 'escalated' && <span className="sp-widget-dot" />}
        </button>
      )}

      {open && (
        <div className="sp-widget-panel">
          <div className="sp-widget-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: isBot ? 7 : 26,
                  background: isBot
                    ? 'linear-gradient(135deg, var(--sp-blue) 0%, #1a6ed0 100%)'
                    : 'linear-gradient(135deg, #3a6b3a 0%, #4a8a4a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <img
                  src={isBot ? '/sunpower/helios-plane.svg' : '/sunpower/person.svg'}
                  alt=""
                  style={{
                    width: isBot ? 22 : 14,
                    height: isBot ? 22 : 14,
                    filter: 'brightness(0) invert(1)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--sp-text-hi)',
                  }}
                >
                  {isBot ? 'Helios' : 'Sam'}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color:
                      heliosStatus === 'thinking'
                        ? 'var(--sp-blue-soft)'
                        : heliosStatus === 'transferring'
                          ? 'var(--sp-warn)'
                          : 'var(--sp-text-lo)',
                    fontWeight: 500,
                  }}
                >
                  {isBot ? heliosStatus : 'human · in the chat'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              {sessionId && (
                <button
                  onClick={markResolved}
                  aria-label="Mark resolved"
                  title="Mark resolved"
                  style={resolvedBtn}
                >
                  ✓
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={closeBtn}
              >
                ×
              </button>
            </div>
          </div>

          {!mode ? (
            <div className="sp-widget-body">
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--sp-text-md)',
                  marginBottom: 12,
                }}
              >
                Pick a lane.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => pickMode(m.id)}
                    className="sp-card"
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      borderLeft: `3px solid ${m.accent}`,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      color: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                className="sp-widget-body"
                style={{ paddingBottom: 8 }}
              >
                {messages.length === 0 && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--sp-text-lo)',
                      textAlign: 'center',
                      padding: 16,
                    }}
                  >
                    {activeMode!.placeholder}
                  </div>
                )}
                {messages.map((m, i) => (
                  <div
                    key={m.id ?? i}
                    style={{
                      display: 'flex',
                      justifyContent:
                        m.role === 'user' ? 'flex-end' : 'flex-start',
                      margin: '6px 0',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '86%',
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
                        padding: '8px 12px',
                        borderRadius: 10,
                        fontSize: 14,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.image_url && (
                        <a
                          href={m.image_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'block', marginBottom: m.content ? 6 : 0 }}
                        >
                          <img
                            src={m.image_url}
                            alt="upload"
                            style={{
                              maxWidth: '100%',
                              maxHeight: 160,
                              borderRadius: 6,
                              display: 'block',
                            }}
                          />
                        </a>
                      )}
                      {renderInline(m.content)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="sp-widget-inputbar">
                {pendingImage && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 6px',
                      background: 'var(--sp-ink-2)',
                      border: '1px solid var(--sp-ink-4)',
                      borderRadius: 6,
                      marginBottom: 6,
                    }}
                  >
                    <img
                      src={pendingImage}
                      alt=""
                      style={{
                        width: 32,
                        height: 32,
                        objectFit: 'cover',
                        borderRadius: 4,
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--sp-text-md)' }}>
                      Image
                    </span>
                    <button
                      onClick={() => setPendingImage(null)}
                      style={{
                        marginLeft: 'auto',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--sp-text-lo)',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: '2px 6px',
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.heic,.heif,.tif,.tiff,.bmp,.avif"
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
                    aria-label="Attach"
                    className="sp-btn sp-btn-ghost sp-widget-icon-btn"
                  >
                    {uploading ? (
                      <span style={{ fontSize: 14 }}>…</span>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M8 2V14M2 8H14"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    disabled={loading}
                    placeholder={
                      pendingImage ? 'Add a note (optional)…' : activeMode!.placeholder
                    }
                    style={widgetInput}
                  />
                  <button
                    onClick={send}
                    disabled={loading || (!input.trim() && !pendingImage)}
                    className="sp-btn sp-widget-send"
                  >
                    ↑
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

const resolvedBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  padding: 0,
  background: 'rgba(74, 138, 74, 0.2)',
  color: '#9fd89f',
  border: '1px solid rgba(74, 138, 74, 0.4)',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const closeBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  padding: 0,
  background: 'transparent',
  color: 'var(--sp-text-lo)',
  border: '1px solid var(--sp-ink-4)',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 18,
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const widgetInput: React.CSSProperties = {
  flex: 1,
  padding: '8px 10px',
  background: 'var(--sp-ink-2)',
  border: '1px solid var(--sp-ink-4)',
  color: 'var(--sp-text-hi)',
  borderRadius: 6,
  fontSize: 16,
  fontFamily: 'inherit',
  outline: 'none',
  WebkitAppearance: 'none',
  minWidth: 0,
};
