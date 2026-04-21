'use client';
import { useState, useRef, useEffect } from 'react';

type Mode = 'in_appt' | 'about_to' | 'lost' | 'need_somebody';

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface TriageResult {
  bucket: string;
  urgency: string;
  reason: string;
}

const MODES: {
  id: Mode;
  label: string;
  sub: string;
  tone: string;
  accent: string;
}[] = [
  {
    id: 'in_appt',
    label: 'In Appointment!!!',
    sub: 'The customer is right here. Fast answer, no fluff.',
    tone: "I've got you. What's the question?",
    accent: '#ff4d4d',
  },
  {
    id: 'about_to',
    label: 'About to be in an Appointment!!',
    sub: 'Minutes out. Let me brief you.',
    tone: "Walk me through what you're walking into.",
    accent: '#f0a040',
  },
  {
    id: 'lost',
    label: "I'm Lost!",
    sub: 'Not sure what you need yet. Let me help you find it.',
    tone: "No worries. Start wherever — what's on your mind?",
    accent: '#58a6ff',
  },
  {
    id: 'need_somebody',
    label: 'Help, I need somebody, not just anybody.',
    sub: "You want a human. Fine. Let's get Sam in the loop.",
    tone: "On it — tell me what's happening and who you're working with.",
    accent: '#b48cff',
  },
];

export default function Triage() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [repName, setRepName] = useState('');
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastTriage, setLastTriage] = useState<TriageResult | null>(null);
  const [lastEscalated, setLastEscalated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading]);

  function pickMode(m: Mode) {
    const selected = MODES.find((x) => x.id === m)!;
    setMode(m);
    setMessages([{ role: 'assistant', content: selected.tone }]);
  }

  async function send() {
    const text = input.trim();
    if (!text || loading || !mode) return;
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, repName, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages([
          ...next,
          {
            role: 'assistant',
            content: `Something broke: ${data.error || 'unknown'}`,
          },
        ]);
      } else {
        setMessages([
          ...next,
          { role: 'assistant', content: data.reply },
        ]);
        setLastTriage(data.triage);
        setLastEscalated(!!data.escalated);
      }
    } catch (err) {
      setMessages([
        ...next,
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
            Pick how urgent this is. I'll match the tempo.
          </p>

          <div style={{ marginTop: 24 }}>
            <input
              placeholder="Your name (so the right human can follow up)"
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#151518',
                border: '1px solid #2a2a2e',
                color: '#eee',
                borderRadius: 8,
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
              marginTop: 18,
            }}
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => pickMode(m.id)}
                disabled={!repName.trim()}
                style={{
                  textAlign: 'left',
                  background: '#131316',
                  border: `1px solid ${m.accent}44`,
                  borderLeft: `3px solid ${m.accent}`,
                  borderRadius: 10,
                  padding: '18px 18px',
                  color: '#eee',
                  cursor: repName.trim() ? 'pointer' : 'not-allowed',
                  opacity: repName.trim() ? 1 : 0.45,
                  fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (repName.trim()) e.currentTarget.style.background = '#1b1b20';
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

          {!repName.trim() && (
            <p style={{ color: '#666', fontSize: 12, marginTop: 14 }}>
              Drop your name in first, then pick a lane.
            </p>
          )}
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
              {activeMode!.label} · <span style={{ color: '#ccc' }}>{repName}</span>
            </div>
            <button
              onClick={() => {
                setMode(null);
                setMessages([]);
                setLastTriage(null);
                setLastEscalated(false);
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
                key={i}
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
                    background: m.role === 'user' ? '#1f2937' : '#141417',
                    border: `1px solid ${m.role === 'user' ? '#2a3a4a' : '#232326'}`,
                    padding: '10px 14px',
                    borderRadius: 12,
                    fontSize: 15,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ color: '#666', fontSize: 13, margin: '8px 4px' }}>
                thinking…
              </div>
            )}

            {lastEscalated && (
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 12px',
                  background: '#1a2a1a',
                  border: '1px solid #2f4a2f',
                  borderRadius: 8,
                  color: '#9fd89f',
                  fontSize: 13,
                }}
              >
                Sent to Sam —{' '}
                <span style={{ color: '#6a8a6a' }}>
                  tagged [{lastTriage?.bucket}] · {lastTriage?.urgency}
                </span>
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
