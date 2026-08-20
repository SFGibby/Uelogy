'use client';

// Bin — soft-archived projects. Restore or hard-delete.

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { GridTask } from '../../lib/supabase';

interface Props {
  onClose: () => void;
  onRestored: (task: GridTask) => void;
}

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const CYAN_FAINT = 'rgba(0,240,255,0.22)';
const RED = '#ff6060';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function BinPanel({ onClose, onRestored }: Props) {
  const [rows, setRows] = useState<GridTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    supabase
      .from('grid_tasks')
      .select('*')
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })
      .then(({ data }) => {
        if (!alive) return;
        setRows((data as GridTask[]) ?? []);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const restore = async (t: GridTask) => {
    setBusyId(t.id);
    const { data, error } = await supabase
      .from('grid_tasks')
      .update({ archived_at: null })
      .eq('id', t.id)
      .select()
      .single();
    setBusyId(null);
    if (error) {
      alert('Restore failed: ' + error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== t.id));
    onRestored(data as GridTask);
  };

  const hardDelete = async (t: GridTask) => {
    if (!confirm('Permanently delete this project and everything under it?')) return;
    setBusyId(t.id);
    const { error } = await supabase.from('grid_tasks').delete().eq('id', t.id);
    setBusyId(null);
    if (error) {
      alert('Delete failed: ' + error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== t.id));
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#020608',
          border: `1px solid ${CYAN_FAINT}`,
          padding: '20px 24px 24px',
          width: '100%',
          maxWidth: 640,
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
          color: '#e0f4f8',
          fontFamily: MONO,
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.36em',
            color: CYAN_DIM,
            textTransform: 'uppercase',
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Bin · {rows.length} archived</span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: CYAN_DIM, fontSize: 18, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{ color: CYAN_DIM, fontSize: 12 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ color: CYAN_DIM, fontSize: 12, padding: '20px 0' }}>The Bin is empty.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rows.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  border: `1px solid ${CYAN_FAINT}`,
                  background: 'rgba(0,0,0,0.35)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f0fbff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                    {t.title || '(untitled)'}
                  </div>
                  <div style={{ color: CYAN_DIM, fontSize: 10, marginTop: 3 }}>
                    Archived{' '}
                    {t.archived_at &&
                      new Date(t.archived_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => restore(t)}
                  disabled={busyId === t.id}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${CYAN}66`,
                    color: CYAN,
                    padding: '5px 10px',
                    fontFamily: MONO,
                    fontSize: 9,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Restore
                </button>
                <button
                  type="button"
                  onClick={() => hardDelete(t)}
                  disabled={busyId === t.id}
                  title="Permanently delete"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${RED}55`,
                    color: RED,
                    padding: '5px 8px',
                    fontFamily: MONO,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
