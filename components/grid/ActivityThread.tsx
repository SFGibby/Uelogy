'use client';

// Chronological message board per project. Newest at top. Add via textarea
// + Enter (Shift+Enter for newline). Autosaves on submit.

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { GridActivity } from '../../lib/supabase';

interface Props {
  taskId: string;
  laneColor: string;
}

const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function ActivityThread({ taskId, laneColor }: Props) {
  const [rows, setRows] = useState<GridActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const laneDim = `${laneColor}aa`;
  const laneFaint = `${laneColor}44`;

  useEffect(() => {
    let alive = true;
    supabase
      .from('grid_activity')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!alive) return;
        setRows((data as GridActivity[]) ?? []);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [taskId]);

  const submit = async () => {
    const content = draft.trim();
    if (!content || busy) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('grid_activity')
      .insert({ task_id: taskId, content })
      .select()
      .single();
    setBusy(false);
    if (error) {
      alert('Post failed: ' + error.message);
      return;
    }
    setRows((prev) => [data as GridActivity, ...prev]);
    setDraft('');
    inputRef.current?.focus();
  };

  const remove = async (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    const { error } = await supabase.from('grid_activity').delete().eq('id', id);
    if (error) alert('Delete failed: ' + error.message);
  };

  const count = rows.length;

  return (
    <div style={{ marginBottom: 10 }}>
      {/* Header — click to toggle */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '4px 0',
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: expanded ? laneColor : laneDim,
          }}
        >
          Activity
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: laneDim,
          }}
        >
          {count}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={2}
              placeholder="Post a note — Enter to send, Shift+Enter for newline"
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.55)',
                border: `1px solid ${laneFaint}`,
                color: '#f5f5f5',
                padding: '8px 10px',
                fontFamily: 'inherit',
                fontSize: 13,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {loading ? (
            <div style={{ color: laneDim, fontSize: 11, fontFamily: MONO }}>Loading…</div>
          ) : rows.length === 0 ? (
            <div style={{ color: laneDim, fontSize: 11, fontFamily: MONO, padding: '4px 0' }}>
              No activity yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rows.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '8px 10px',
                    border: `1px solid ${laneFaint}`,
                    background: 'rgba(0,0,0,0.35)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: '#f5f5f5',
                        fontSize: 13,
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5,
                      }}
                    >
                      {r.content}
                    </div>
                    <div
                      style={{
                        color: laneDim,
                        fontSize: 10,
                        fontFamily: MONO,
                        marginTop: 4,
                        letterSpacing: '0.08em',
                      }}
                    >
                      {new Date(r.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,96,96,0.5)',
                      fontSize: 12,
                      cursor: 'pointer',
                      alignSelf: 'flex-start',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
