'use client';

// Task list under a Project. Auto-saves per row.
// (This file used to be called "SubtaskList" — kept the file/component name to
// avoid a rename churn, but the UI copy is "Tasks".)

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { GridSubtask, GridType, GridPriority, GridAttachment } from '../../lib/supabase';
import { supabase as sb } from '../../lib/supabase';

interface Props {
  taskId: string;
  owners: GridType[];
  onOwnerAdded?: (owner: GridType) => void;
  onSubtasksChanged?: (rows: GridSubtask[]) => void;
}

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const CYAN_FAINT = 'rgba(0,240,255,0.22)';
const OVERDUE = '#ff2040';
const BLOCKER_RED = '#ff2040';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

// Reversed convention (Sam-style, 2026-08-20):
// P3 = Critical (worst / highest), P0 = Low (best / lowest)
const PRIORITY_META: Record<GridPriority, { color: string; label: string }> = {
  0: { color: '#5a6a7a', label: 'P0' },
  1: { color: '#f0a000', label: 'P1' },
  2: { color: '#00f0ff', label: 'P2' },
  3: { color: '#ff2040', label: 'P3' },
};

// Sam-style aging: date field represents "asked / assigned" — glow by age.
// null / no date = neutral. Recent = cyan, stale = amber, cold = red.
function ageMeta(due_at?: string | null): { days: number | null; color: string; label: string } {
  if (!due_at) return { days: null, color: 'transparent', label: '' };
  const d = new Date(due_at + 'T00:00:00');
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (days < 0) return { days, color: '#00f0ff', label: `${days}d` };
  if (days <= 7) return { days, color: '#00f0ff', label: `${days}d` };
  if (days <= 14) return { days, color: '#f0a000', label: `${days}d` };
  return { days, color: '#ff2040', label: `${days}d` };
}

export default function SubtaskList({ taskId, owners, onOwnerAdded, onSubtasksChanged }: Props) {
  const [rows, setRows] = useState<GridSubtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerPickerFor, setOwnerPickerFor] = useState<string | null>(null);
  const [priorityPickerFor, setPriorityPickerFor] = useState<string | null>(null);
  const [blockerOwnerPickerFor, setBlockerOwnerPickerFor] = useState<string | null>(null);
  const [blockerFor, setBlockerFor] = useState<string | null>(null);
  const [newOwnerDraft, setNewOwnerDraft] = useState('');
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const notifyChanged = (next: GridSubtask[]) => {
    onSubtasksChanged?.(next);
  };

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
      .insert({ task_id: taskId, title: '', position: nextPos, done: false, priority: 3 })
      .select()
      .single();
    if (error) {
      alert('Add task failed: ' + error.message);
      return;
    }
    setRows((prev) => {
      const next = [...prev, data as GridSubtask];
      notifyChanged(next);
      return next;
    });
  };

  const patch = (id: string, changes: Partial<GridSubtask>) => {
    setRows((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...changes } : r));
      notifyChanged(next);
      return next;
    });
  };

  const persist = async (id: string, changes: Partial<GridSubtask>) => {
    const { error } = await supabase.from('grid_subtasks').update(changes).eq('id', id);
    if (error) alert('Save failed: ' + error.message);
  };

  const removeRow = async (id: string) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      notifyChanged(next);
      return next;
    });
    const { error } = await supabase.from('grid_subtasks').delete().eq('id', id);
    if (error) alert('Delete failed: ' + error.message);
  };

  const uploadFor = async (row: GridSubtask, file: File) => {
    setUploadingFor(row.id);
    try {
      const path = `tasks/${row.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await sb.storage
        .from('grid-attachments')
        .upload(path, file, { cacheControl: '3600' });
      if (upErr) throw upErr;
      const { data: pub } = sb.storage.from('grid-attachments').getPublicUrl(path);
      const entry: GridAttachment = {
        name: file.name,
        url: pub.publicUrl,
        size: file.size,
        uploaded_at: new Date().toISOString(),
      };
      const nextAttachments = [...(row.attachments ?? []), entry];
      patch(row.id, { attachments: nextAttachments });
      await persist(row.id, { attachments: nextAttachments });
    } catch (e) {
      alert('Upload failed: ' + (e as Error).message);
    } finally {
      setUploadingFor(null);
    }
  };

  const removeAttachment = async (row: GridSubtask, i: number) => {
    const nextAttachments = (row.attachments ?? []).filter((_, idx) => idx !== i);
    patch(row.id, { attachments: nextAttachments });
    await persist(row.id, { attachments: nextAttachments });
  };

  const createOwner = async (name: string, subtaskId: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { data, error } = await supabase
      .from('grid_types')
      .insert({ name: trimmed, color: '#9999ff' })
      .select()
      .single();
    if (error) {
      alert('Owner add failed: ' + error.message);
      return;
    }
    const newOwner = data as GridType;
    onOwnerAdded?.(newOwner);
    patch(subtaskId, { owner_id: newOwner.id });
    persist(subtaskId, { owner_id: newOwner.id });
    setOwnerPickerFor(null);
    setNewOwnerDraft('');
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
        <span>Tasks</span>
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
            const p = PRIORITY_META[r.priority] ?? PRIORITY_META[3];
            const age = ageMeta(r.due_at);
            const aged = !r.done && age.days !== null;
            const blocked = !!r.blocked_reason?.trim();
            const showOwnerPicker = ownerPickerFor === r.id;
            const showPriorityPicker = priorityPickerFor === r.id;
            const showBlocker = blockerFor === r.id;

            return (
              <div
                key={r.id}
                style={{
                  padding: '6px 8px',
                  border: `1px solid ${aged ? age.color + '66' : CYAN_FAINT}`,
                  background: r.done ? 'rgba(0,240,255,0.04)' : 'transparent',
                  boxShadow: aged ? `0 0 8px ${age.color}55, inset 0 0 0 1px ${age.color}55` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                    placeholder="Task title…"
                    style={{
                      flex: 1,
                      minWidth: 60,
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
                  {/* Priority */}
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setPriorityPickerFor(showPriorityPicker ? null : r.id)}
                      style={{
                        fontSize: 9,
                        fontFamily: MONO,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        background: 'transparent',
                        border: `1px solid ${p.color}66`,
                        color: p.color,
                        padding: '3px 6px',
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                    {showPriorityPicker && (
                      <div style={pickerBoxStyle}>
                        {([0, 1, 2, 3] as GridPriority[]).map((pv) => {
                          const pm = PRIORITY_META[pv];
                          return (
                            <button
                              key={pv}
                              type="button"
                              onClick={() => {
                                patch(r.id, { priority: pv });
                                persist(r.id, { priority: pv });
                                setPriorityPickerFor(null);
                              }}
                              style={pickerOptionStyle(r.priority === pv, pm.color)}
                            >
                              {pm.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* Owner */}
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setOwnerPickerFor(showOwnerPicker ? null : r.id)}
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
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {owner ? owner.name : '+ Owner'}
                    </button>
                    {showOwnerPicker && (
                      <div style={{ ...pickerBoxStyle, minWidth: 180 }}>
                        <button
                          type="button"
                          onClick={() => {
                            patch(r.id, { owner_id: null });
                            persist(r.id, { owner_id: null });
                            setOwnerPickerFor(null);
                          }}
                          style={pickerOptionStyle(!owner, CYAN_DIM)}
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
                            style={pickerOptionStyle(owner?.id === o.id, o.color)}
                          >
                            {o.name}
                          </button>
                        ))}
                        <input
                          type="text"
                          value={newOwnerDraft}
                          onChange={(e) => setNewOwnerDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              createOwner(newOwnerDraft, r.id);
                            }
                          }}
                          placeholder="+ new owner — Enter"
                          style={{
                            marginTop: 4,
                            padding: '5px 8px',
                            background: 'rgba(0,12,16,0.7)',
                            border: `1px solid ${CYAN_FAINT}`,
                            color: '#e0f4f8',
                            fontFamily: MONO,
                            fontSize: 10,
                            outline: 'none',
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {/* Assigned/asked date + age counter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="date"
                      title={aged ? `Asked ${age.days} day${age.days === 1 ? '' : 's'} ago` : 'Set the day this was asked/assigned'}
                      value={r.due_at ?? ''}
                      onChange={(e) => {
                        const v = e.target.value || null;
                        patch(r.id, { due_at: v });
                        persist(r.id, { due_at: v });
                      }}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${aged ? age.color : CYAN_FAINT}`,
                        color: aged ? age.color : CYAN_DIM,
                        padding: '3px 5px',
                        fontFamily: MONO,
                        fontSize: 10,
                        colorScheme: 'dark',
                      }}
                    />
                    {aged && (
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          color: age.color,
                        }}
                      >
                        {age.label}
                      </span>
                    )}
                  </div>
                  {/* Attachments */}
                  <label
                    title={
                      (r.attachments?.length ?? 0) > 0
                        ? `${r.attachments!.length} file(s) attached`
                        : 'Attach file'
                    }
                    style={{
                      fontSize: 10,
                      fontFamily: MONO,
                      background: 'transparent',
                      border: `1px solid ${CYAN_FAINT}`,
                      color: (r.attachments?.length ?? 0) > 0 ? CYAN : CYAN_DIM,
                      padding: '3px 6px',
                      cursor: uploadingFor === r.id ? 'wait' : 'pointer',
                      lineHeight: 1,
                      opacity: uploadingFor === r.id ? 0.5 : 1,
                    }}
                  >
                    ⎘{r.attachments && r.attachments.length > 0 ? ` ${r.attachments.length}` : ''}
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      disabled={uploadingFor === r.id}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadFor(r, f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {/* Blocker toggle */}
                  <button
                    type="button"
                    onClick={() => setBlockerFor(showBlocker ? null : r.id)}
                    title={blocked ? 'Blocker' : 'Add blocker'}
                    style={{
                      fontSize: 12,
                      fontFamily: MONO,
                      background: 'transparent',
                      border: `1px solid ${blocked ? BLOCKER_RED : CYAN_FAINT}66`,
                      color: blocked ? BLOCKER_RED : CYAN_DIM,
                      padding: '2px 6px',
                      cursor: 'pointer',
                      lineHeight: 1,
                    }}
                  >
                    ⚑
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(r.id)}
                    title="Delete task"
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
                {/* Attachment chips (compact) */}
                {(r.attachments?.length ?? 0) > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {(r.attachments ?? []).map((a, ai) => (
                      <div
                        key={ai}
                        style={{
                          display: 'flex',
                          gap: 6,
                          alignItems: 'center',
                          padding: '3px 6px',
                          border: `1px solid ${CYAN_FAINT}`,
                          fontSize: 10,
                          fontFamily: MONO,
                        }}
                      >
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ flex: 1, color: CYAN, textDecoration: 'underline', textUnderlineOffset: 2 }}
                        >
                          {a.name}
                        </a>
                        <button
                          type="button"
                          onClick={() => removeAttachment(r, ai)}
                          style={{ background: 'transparent', border: 'none', color: 'rgba(255,96,96,0.6)', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {showBlocker && (
                  <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <textarea
                      value={r.blocked_reason ?? ''}
                      onChange={(e) => patch(r.id, { blocked_reason: e.target.value })}
                      onBlur={() => persist(r.id, { blocked_reason: (r.blocked_reason ?? '').trim() || null })}
                      placeholder="Blocker: question or dependency"
                      rows={2}
                      style={{
                        width: '100%',
                        background: 'rgba(255,32,64,0.06)',
                        border: `1px solid ${BLOCKER_RED}55`,
                        color: '#f6c8cf',
                        fontFamily: 'inherit',
                        fontSize: 12,
                        padding: '6px 8px',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                    <BlockerOwnerPicker
                      row={r}
                      owners={owners}
                      isOpen={blockerOwnerPickerFor === r.id}
                      onToggle={() =>
                        setBlockerOwnerPickerFor(blockerOwnerPickerFor === r.id ? null : r.id)
                      }
                      onPick={(oid) => {
                        patch(r.id, { blocker_owner_id: oid });
                        persist(r.id, { blocker_owner_id: oid });
                        setBlockerOwnerPickerFor(null);
                      }}
                    />
                  </div>
                )}
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
        + Add task
      </button>
    </div>
  );
}

const pickerBoxStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  right: 0,
  zIndex: 20,
  background: '#020608',
  border: `1px solid ${CYAN_FAINT}`,
  padding: 6,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 100,
  maxHeight: 220,
  overflowY: 'auto',
};

function BlockerOwnerPicker({
  row,
  owners,
  isOpen,
  onToggle,
  onPick,
}: {
  row: GridSubtask;
  owners: GridType[];
  isOpen: boolean;
  onToggle: () => void;
  onPick: (id: string | null) => void;
}) {
  const owner = row.blocker_owner_id ? owners.find((o) => o.id === row.blocker_owner_id) : null;
  return (
    <div style={{ position: 'relative', alignSelf: 'flex-start' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          fontSize: 9,
          fontFamily: MONO,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          background: 'transparent',
          border: `1px solid ${owner ? owner.color : BLOCKER_RED}66`,
          color: owner ? owner.color : `${BLOCKER_RED}bb`,
          padding: '3px 7px',
          cursor: 'pointer',
        }}
      >
        {owner ? `Waiting on ${owner.name}` : '+ Waiting on…'}
      </button>
      {isOpen && (
        <div style={{ ...pickerBoxStyle, right: 'auto', left: 0 }}>
          <button type="button" onClick={() => onPick(null)} style={pickerOptionStyle(!owner, CYAN_DIM)}>
            No one
          </button>
          {owners.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onPick(o.id)}
              style={pickerOptionStyle(owner?.id === o.id, o.color)}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function pickerOptionStyle(active: boolean, color: string): React.CSSProperties {
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
