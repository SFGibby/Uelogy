'use client';

// Subtask list for a single task. Renders inside TaskEditModal.
// Each row auto-saves on blur / checkbox toggle / owner change.

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { GridSubtask, GridType } from '../../lib/supabase';

interface Props {
  taskId: string;
  owners: GridType[];
}

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const CYAN_FAINT = 'rgba(0,240,255,0.22)';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function SubtaskList({ taskId, owners }: Props) {
  const [rows, setRows] = useState<GridSubtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerPickerFor, setOwnerPickerFor] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    supabase
      .from('grid_subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('position')
      .then(({ data }) => {
        if (!alive) return;
        setRows((data as GridSubtask[]) ?? []);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [taskId]);

  const addRow = async () => {
    const nextPos = rows.reduce((m, r) => Math.max(m, r.position), -1) + 1;
    const { data, error } = await supabase
      .from('grid_subtasks')
      .insert({ task_id: taskId, title: '', position: nextPos, done: false })
      .select()
      .single();
    if (error) {
      alert('Add subtask failed: ' + error.message);
      return;
    }
    setRows((prev) => [...prev, data as GridSubtask]);
  };

  const patch = (id: string, changes: Partial<GridSubtask>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  };

  const persist = async (id: string, changes: Partial<GridSubtask>) => {
    const { error } = await supabase.from('grid_subtasks').update(changes).eq('id', id);
    if (error) alert('Save failed: ' + error.message);
  };

  const removeRow = async (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    const { error } = await supabase.from('grid_subtasks').delete().eq('id', id);
    if (error) alert('Delete failed: ' + error.message);
  };

  const done = rows.filter((r) => r.done).length;

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: CYAN_DIM,
          fontFamily: MONO,
          fontWeight: 700,
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Subtasks</span>
        {rows.length > 0 && (
          <span>
            {done} / {rows.length}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ fontSize: 11, color: CYAN_DIM, fontFamily: MONO }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rows.map((r) => {
            const owner = r.owner_id ? owners.find((o) => o.id === r.owner_id) : null;
            const showPicker = ownerPickerFor === r.id;
            return (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  border: `1px solid ${CYAN_FAINT}`,
                  background: r.done ? 'rgba(0,240,255,0.04)' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={r.done}
                  onChange={(e) => {
                    patch(r.id, { done: e.target.checked });
                    persist(r.id, { done: e.target.checked });
                  }}
                  style={{ accentColor: CYAN, cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={r.title}
                  onChange={(e) => patch(r.id, { title: e.target.value })}
                  onBlur={() => persist(r.id, { title: r.title.trim() })}
                  placeholder="Subtask title…"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: r.done ? CYAN_DIM : '#e0f4f8',
                    textDecoration: r.done ? 'line-through' : 'none',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    outline: 'none',
                    padding: '2px 0',
                  }}
                />
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setOwnerPickerFor(showPicker ? null : r.id)}
                    style={{
                      fontSize: 9,
                      fontFamily: MONO,
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      background: 'transparent',
                      border: `1px solid ${owner ? owner.color : CYAN_FAINT}`,
                      color: owner ? owner.color : CYAN_DIM,
                      padding: '3px 7px',
                      cursor: 'pointer',
                    }}
                  >
                    {owner ? owner.name : '+ Owner'}
                  </button>
                  {showPicker && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        right: 0,
                        zIndex: 10,
                        background: '#020608',
                        border: `1px solid ${CYAN_FAINT}`,
                        padding: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        minWidth: 140,
                        maxHeight: 200,
                        overflowY: 'auto',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          patch(r.id, { owner_id: null });
                          persist(r.id, { owner_id: null });
                          setOwnerPickerFor(null);
                        }}
                        style={ownerOptionStyle(!owner, CYAN_DIM)}
                      >
                        Unassigned
                      </button>
                      {owners.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => {
                            patch(r.id, { owner_id: o.id });
                            persist(r.id, { owner_id: o.id });
                            setOwnerPickerFor(null);
                          }}
                          style={ownerOptionStyle(owner?.id === o.id, o.color)}
                        >
                          {o.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(r.id)}
                  title="Delete subtask"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,96,96,0.6)',
                    fontSize: 14,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={addRow}
        style={{
          width: '100%',
          marginTop: 6,
          padding: '8px',
          background: 'transparent',
          border: `1px dashed ${CYAN_FAINT}`,
          color: CYAN_DIM,
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        + Add subtask
      </button>
    </div>
  );
}

function ownerOptionStyle(active: boolean, color: string): React.CSSProperties {
  return {
    padding: '5px 8px',
    background: active ? color + '22' : 'transparent',
    border: `1px solid ${active ? color : 'transparent'}`,
    color: active ? color : '#cfe9f0',
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    fontWeight: 700,
    textAlign: 'left',
    cursor: 'pointer',
  };
}
