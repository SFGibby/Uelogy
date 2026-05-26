'use client';

// Task editor — the rich modal that replaces the prompt() in KanbanBoard's
// "+ Add task" flow and also opens when admin clicks a card.

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { GridTask, GridStage, GridType, GridTaskLink } from '../../lib/supabase';

interface Props {
  task: GridTask | null;       // null when creating
  defaultStageId?: string | null;
  stages: GridStage[];
  types: GridType[];
  onClose: () => void;
  onSaved: (task: GridTask) => void;
  onDeleted: (id: string) => void;
}

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const CYAN_FAINT = 'rgba(0,240,255,0.22)';
const AMBER = '#f0a000';
const RED = '#ff6060';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function TaskEditModal({
  task,
  defaultStageId,
  stages,
  types,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [stageId, setStageId] = useState<string | null>(
    task?.stage_id ?? defaultStageId ?? stages[0]?.id ?? null
  );
  const [typeId, setTypeId] = useState<string | null>(task?.type_id ?? null);
  const [dueAt, setDueAt] = useState(task?.due_at ?? '');
  const [links, setLinks] = useState<GridTaskLink[]>(task?.links ?? []);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    const cleanLinks = links.filter((l) => l.label.trim() && l.url.trim());
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      stage_id: stageId,
      type_id: typeId,
      due_at: dueAt || null,
      links: cleanLinks,
    };
    try {
      if (task) {
        const { data, error } = await supabase
          .from('grid_tasks')
          .update(payload)
          .eq('id', task.id)
          .select()
          .single();
        if (error) throw error;
        onSaved(data as GridTask);
      } else {
        // Insert at end of target stage
        const { data: existing } = await supabase
          .from('grid_tasks')
          .select('position')
          .eq('stage_id', stageId);
        const maxPos = (existing ?? []).reduce(
          (m, t) => Math.max(m, t.position),
          -1
        );
        const { data, error } = await supabase
          .from('grid_tasks')
          .insert({ ...payload, position: maxPos + 1 })
          .select()
          .single();
        if (error) throw error;
        onSaved(data as GridTask);
      }
      onClose();
    } catch (e) {
      alert('Save failed: ' + String(e));
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!task) return;
    if (!confirm('Delete this task?')) return;
    const { error } = await supabase.from('grid_tasks').delete().eq('id', task.id);
    if (error) {
      alert('Delete failed: ' + error.message);
      return;
    }
    onDeleted(task.id);
    onClose();
  };

  const updateLink = (i: number, patch: Partial<GridTaskLink>) => {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };
  const removeLink = (i: number) => setLinks((prev) => prev.filter((_, idx) => idx !== i));
  const addLink = () => setLinks((prev) => [...prev, { label: '', url: '' }]);

  // Inline style helpers
  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: CYAN_DIM,
    fontFamily: MONO,
    fontWeight: 700,
    marginBottom: 6,
    display: 'block',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(0,12,16,0.7)',
    border: `1px solid ${CYAN_FAINT}`,
    color: '#e0f4f8',
    padding: '10px 12px',
    fontFamily: MONO,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
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
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#020608',
          border: `1px solid ${CYAN_FAINT}`,
          boxShadow: `0 0 36px rgba(0,240,255,0.15), inset 0 0 0 1px rgba(0,240,255,0.05)`,
          width: '100%',
          maxWidth: 580,
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
          clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)',
          padding: '24px 28px 24px',
          color: '#e0f4f8',
          fontFamily: MONO,
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.36em',
            color: CYAN_DIM,
            textTransform: 'uppercase',
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{task ? 'Edit Task' : 'New Task'}</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: CYAN_DIM,
              fontSize: 18,
              cursor: 'pointer',
              padding: 0,
              fontFamily: MONO,
            }}
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Title</label>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                save();
              }
            }}
            style={{ ...inputStyle, fontSize: 17, fontFamily: 'inherit', padding: '12px 14px', color: CYAN }}
            placeholder="What is this task?"
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Notes</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ ...inputStyle, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', minHeight: 70 }}
            placeholder="Optional. What does done look like?"
          />
        </div>

        {/* Stage chips */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Stage</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {stages.map((s) => {
              const active = stageId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStageId(s.id)}
                  style={{
                    padding: '7px 12px',
                    background: active ? s.color + '22' : 'transparent',
                    border: `1px solid ${active ? s.color : CYAN_FAINT}`,
                    color: active ? s.color : CYAN_DIM,
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ width: 7, height: 7, background: s.color, boxShadow: `0 0 6px ${s.color}aa` }} />
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Type chips */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Type</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              type="button"
              onClick={() => setTypeId(null)}
              style={{
                padding: '7px 12px',
                background: typeId === null ? 'rgba(0,240,255,0.10)' : 'transparent',
                border: `1px solid ${typeId === null ? CYAN : CYAN_FAINT}`,
                color: typeId === null ? CYAN : CYAN_DIM,
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              None
            </button>
            {types.map((t) => {
              const active = typeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeId(t.id)}
                  style={{
                    padding: '7px 12px',
                    background: active ? t.color + '22' : 'transparent',
                    border: `1px solid ${active ? t.color : CYAN_FAINT}`,
                    color: active ? t.color : CYAN_DIM,
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Due date */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Due date (optional)</label>
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            style={{ ...inputStyle, width: 'auto', minWidth: 180, colorScheme: 'dark' }}
          />
        </div>

        {/* Links */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Links (optional)</label>
          {links.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
              {links.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Label"
                    value={l.label}
                    onChange={(e) => updateLink(i, { label: e.target.value })}
                    style={{ ...inputStyle, width: 140, flexShrink: 0 }}
                  />
                  <input
                    type="url"
                    placeholder="https://…"
                    value={l.url}
                    onChange={(e) => updateLink(i, { url: e.target.value })}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${CYAN_FAINT}`,
                      color: CYAN_DIM,
                      padding: '0 10px',
                      cursor: 'pointer',
                      fontFamily: MONO,
                      fontSize: 12,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addLink}
            style={{
              background: 'transparent',
              border: `1px dashed ${CYAN_FAINT}`,
              color: CYAN_DIM,
              padding: '6px 14px',
              cursor: 'pointer',
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            + Add link
          </button>
        </div>

        {/* Footer actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: `1px solid ${CYAN_FAINT}`,
            paddingTop: 14,
          }}
        >
          <div>
            {task && (
              <button
                type="button"
                onClick={del}
                style={{
                  background: 'transparent',
                  border: `1px solid ${RED}55`,
                  color: RED,
                  padding: '8px 14px',
                  fontFamily: MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: `1px solid ${CYAN_FAINT}`,
                color: CYAN_DIM,
                padding: '8px 16px',
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!title.trim() || saving}
              style={{
                background: !title.trim() || saving ? 'rgba(0,240,255,0.15)' : CYAN,
                border: `1px solid ${CYAN}`,
                color: !title.trim() || saving ? CYAN_DIM : '#000',
                padding: '8px 18px',
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: !title.trim() || saving ? 'default' : 'pointer',
                boxShadow: !title.trim() || saving ? 'none' : `0 0 12px ${AMBER}00, 0 0 12px ${CYAN}99`,
              }}
            >
              {saving ? 'Saving…' : task ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
