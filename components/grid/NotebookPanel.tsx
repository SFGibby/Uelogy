'use client';

// Personal Q&A / notebook — a single always-visible scratchpad below the
// swimlanes. One row in grid_notebook. Autosave on blur.

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { GridNotebook } from '../../lib/supabase';

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const CYAN_FAINT = 'rgba(0,240,255,0.22)';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function NotebookPanel() {
  const [row, setRow] = useState<GridNotebook | null>(null);
  const [content, setContent] = useState('');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const initialLoad = useRef(true);

  useEffect(() => {
    let alive = true;
    supabase
      .from('grid_notebook')
      .select('*')
      .order('updated_at', { ascending: true })
      .limit(1)
      .then(({ data }) => {
        if (!alive) return;
        const first = (data?.[0] as GridNotebook | undefined) ?? null;
        setRow(first);
        setContent(first?.content ?? '');
        initialLoad.current = false;
      });
    return () => {
      alive = false;
    };
  }, []);

  const persist = async () => {
    if (!row) return;
    const { error } = await supabase
      .from('grid_notebook')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', row.id);
    if (error) {
      alert('Notebook save failed: ' + error.message);
      return;
    }
    setSavedAt(new Date());
  };

  return (
    <div
      style={{
        marginTop: 24,
        border: `1px solid ${CYAN_FAINT}`,
        background: 'rgba(0, 12, 16, 0.65)',
        padding: '14px 16px 16px',
        clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.3em',
            color: CYAN_DIM,
            textTransform: 'uppercase',
          }}
        >
          Q&amp;A · Notebook
        </div>
        {savedAt && (
          <div
            style={{
              fontFamily: MONO,
              fontSize: 9,
              color: CYAN_DIM,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Saved · {savedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={persist}
        rows={6}
        placeholder="Things to research, questions I need to ask, half-thoughts. Nothing here is blocking — it's just a place to put stuff so it doesn't leave my head."
        style={{
          width: '100%',
          background: 'rgba(0,0,0,0.55)',
          border: `1px solid ${CYAN_FAINT}`,
          color: '#f5f5f5',
          padding: '10px 12px',
          fontFamily: 'inherit',
          fontSize: 13,
          lineHeight: 1.55,
          outline: 'none',
          resize: 'vertical',
          minHeight: 120,
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _cyanUsed = CYAN;
