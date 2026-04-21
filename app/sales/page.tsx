'use client';
import { useState, useRef, useEffect } from 'react';

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface TriageResult {
  bucket: string;
  urgency: string;
  reason: string;
  evidence: string;
  needsMoreInfo: boolean;
  followupQuestion?: string;
}

const INTRO = `Hey. I'm your appointment backup. Tell me: what product line (Direct / EPC / PIP), what deal stage (in-home pitch / close / post-install), and what's the customer asking or blocking on? I'll answer fast or route it.`;

export default function SalesBot() {
  const [repName, setRepName] = useState('');
  const [repLocked, setRepLocked] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([
    { role: 'assistant', content: INTRO },
  ]);
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

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/sales-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, repName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages([
          ...next,
          {
            role: 'assistant',
            content: `Error: ${data.error || 'unknown'}`,
          },
        ]);
      } else {
        const bot: ChatTurn = { role: 'assistant', content: data.reply };
        const additions: ChatTurn[] = [bot];
        if (data.triage?.needsMoreInfo && data.triage.followupQuestion) {
          additions.push({
            role: 'assistant',
            content: `Quick triage Q: ${data.triage.followupQuestion}`,
          });
        }
        setMessages([...next, ...additions]);
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

  const urgencyColor = (u?: string) =>
    u === 'URGENT' ? '#ff5a5a' : u === 'NORMAL' ? '#f0c040' : '#55a855';

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#0d0d0d',
        color: '#eee',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '760px',
          width: '100%',
          margin: '0 auto',
          padding: '24px 20px 0',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '20px', letterSpacing: '0.02em' }}>
          Sales Appointment Bot
        </h1>
        <p style={{ margin: '4px 0 16px', color: '#888', fontSize: '13px' }}>
          In-appointment answers and smart escalation routing. Prototype.
        </p>

        {!repLocked ? (
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 16,
              alignItems: 'center',
            }}
          >
            <input
              placeholder="Your name (for escalation emails)"
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && repName.trim()) setRepLocked(true);
              }}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                color: '#eee',
                borderRadius: 6,
                fontSize: 14,
              }}
            />
            <button
              onClick={() => repName.trim() && setRepLocked(true)}
              style={{
                padding: '10px 16px',
                background: '#2a6',
                border: 'none',
                color: '#fff',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Start
            </button>
          </div>
        ) : (
          <div style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
            Rep: <span style={{ color: '#ddd' }}>{repName}</span>
          </div>
        )}
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
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              margin: '8px 0',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                background: m.role === 'user' ? '#1f4a2d' : '#1a1a1a',
                border: '1px solid #2a2a2a',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 15,
                lineHeight: 1.45,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ color: '#888', fontSize: 13, margin: '8px 4px' }}>
            thinking…
          </div>
        )}

        {lastTriage && (
          <div
            style={{
              margin: '16px 0',
              padding: '10px 12px',
              background: '#111',
              border: '1px solid #2a2a2a',
              borderRadius: 6,
              fontSize: 12,
              color: '#aaa',
            }}
          >
            <div>
              <strong style={{ color: urgencyColor(lastTriage.urgency) }}>
                {lastTriage.urgency}
              </strong>{' '}
              · bucket: <strong>{lastTriage.bucket}</strong> · escalated:{' '}
              <strong>{lastEscalated ? 'yes' : 'no'}</strong>
            </div>
            <div style={{ marginTop: 4 }}>{lastTriage.reason}</div>
            <div style={{ marginTop: 2, color: '#666' }}>
              evidence: {lastTriage.evidence}
            </div>
          </div>
        )}
      </div>

      {repLocked && (
        <div
          style={{
            borderTop: '1px solid #222',
            padding: '12px 20px',
            background: '#0a0a0a',
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
              placeholder="What's happening in the appointment?"
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
                background: '#1a1a1a',
                border: '1px solid #333',
                color: '#eee',
                borderRadius: 6,
                fontSize: 15,
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                padding: '12px 18px',
                background: loading ? '#333' : '#2a6',
                border: 'none',
                color: '#fff',
                borderRadius: 6,
                cursor: loading ? 'default' : 'pointer',
                fontSize: 14,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
