'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';

interface Msg { role: 'user' | 'assistant'; content: string }

const STARTERS = [
  'What systems do reps use to track customers?',
  'Where do I find the rep onboarding flow?',
  'Who owns commissions issues?',
];

export default function TriageDemoPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send(text: string) {
    if (streaming || !text.trim()) return;
    const next: Msg[] = [
      ...messages,
      { role: 'user', content: text.trim() },
      { role: 'assistant', content: '' },
    ];
    setMessages(next);
    setInput('');
    setStreaming(true);
    try {
      const res = await fetch('/api/triage/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(0, -1) }),
      });
      if (!res.ok || !res.body) throw new Error(`status ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: 'Hit a snag on my end. Try that again.' };
        return copy;
      });
    } finally {
      setStreaming(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function reset() {
    if (streaming) return;
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  }

  return (
    <main style={{ position: 'relative', minHeight: 'calc(100vh - 60px)' }}>
      <div className="sp-mesh" />
      <div className="sp-grid" />
      <div
        className="sp-container"
        style={{
          position: 'relative',
          zIndex: 2,
          paddingTop: 48,
          paddingBottom: 28,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 60px)',
          maxWidth: 820,
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--sp-text-lo)',
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            Helios · Demo
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: -0.5, color: 'var(--sp-text-hi)' }}>
            Ask anything.
          </h1>
          <p style={{ color: 'var(--sp-text-md)', margin: '10px 0 0', fontSize: 15, lineHeight: 1.55 }}>
            No mode picker. No forms. Real bot, real KB.
          </p>
        </div>

        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: 6,
            marginBottom: 16,
            minHeight: 280,
          }}
        >
          {messages.length === 0 && (
            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  color: 'var(--sp-text-lo)',
                  fontSize: 12,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                  fontWeight: 600,
                }}
              >
                Try
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={streaming}
                    style={{
                      textAlign: 'left',
                      background: 'var(--sp-ink-2)',
                      border: '1px solid var(--sp-ink-3)',
                      borderRadius: 12,
                      padding: '12px 16px',
                      color: 'var(--sp-text-md)',
                      fontSize: 14,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--sp-ink-4)';
                      e.currentTarget.style.color = 'var(--sp-text-hi)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--sp-ink-3)';
                      e.currentTarget.style.color = 'var(--sp-text-md)';
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => {
            const isUser = m.role === 'user';
            const isStreamingThis = streaming && i === messages.length - 1 && !isUser;
            return (
              <div
                key={i}
                style={{
                  marginBottom: 14,
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: isUser ? 'var(--sp-blue)' : 'var(--sp-ink-2)',
                    color: isUser ? '#fff' : 'var(--sp-text-hi)',
                    border: isUser ? 'none' : '1px solid var(--sp-ink-3)',
                    fontSize: 15,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {m.content || (isStreamingThis ? <span style={{ opacity: 0.55 }}>…</span> : '')}
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            padding: '10px 10px 10px 14px',
            background: 'var(--sp-ink-2)',
            border: '1px solid var(--sp-ink-3)',
            borderRadius: 14,
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask anything…"
            disabled={streaming}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--sp-text-hi)',
              fontSize: 15,
              padding: '8px 4px',
              fontFamily: 'inherit',
              resize: 'none',
              maxHeight: 140,
              lineHeight: 1.5,
            }}
          />
          {messages.length > 0 && (
            <button
              type="button"
              onClick={reset}
              disabled={streaming}
              style={{
                background: 'transparent',
                color: 'var(--sp-text-lo)',
                border: '1px solid var(--sp-ink-3)',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 13,
                cursor: streaming ? 'default' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Reset
            </button>
          )}
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            style={{
              background: 'var(--sp-blue)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '9px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor: streaming || !input.trim() ? 'default' : 'pointer',
              opacity: streaming || !input.trim() ? 0.5 : 1,
              fontFamily: 'inherit',
            }}
          >
            {streaming ? '…' : 'Send'}
          </button>
        </form>
      </div>
    </main>
  );
}
