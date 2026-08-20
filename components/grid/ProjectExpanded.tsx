'use client';

// Expanded view of a Project — renders inline inside a lane instead of a modal.
// All fields autosave on blur / change.

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { GridTask, GridType, GridAttachment, GridSubtask } from '../../lib/supabase';
import SubtaskList from './SubtaskList';
import OwnerCombobox from './OwnerCombobox';

interface Props {
  task: GridTask;
  laneColor: string;
  owners: GridType[];
  subtasks?: GridSubtask[];
  onCollapse: () => void;
  onDeleted: (id: string) => void;
  onLocalUpdate: (task: GridTask) => void;
  onOwnerAdded?: (owner: GridType) => void;
  onSubtasksChanged?: (rows: GridSubtask[]) => void;
}

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const CYAN_FAINT = 'rgba(0,240,255,0.22)';
const BLOCKER_RED = '#ff2040';
const OVERDUE = '#ff2040';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

function isOverdue(due_at?: string | null): boolean {
  if (!due_at) return false;
  return new Date(due_at + 'T23:59:59').getTime() < Date.now();
}

export default function ProjectExpanded({
  task,
  laneColor,
  owners,
  subtasks = [],
  onCollapse,
  onDeleted,
  onLocalUpdate,
  onOwnerAdded,
  onSubtasksChanged,
}: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [blockedReason, setBlockedReason] = useState(task.blocked_reason ?? '');
  const [blockerOwnerId, setBlockerOwnerId] = useState<string | null>(task.blocker_owner_id ?? null);
  const [qna, setQna] = useState(task.qna ?? '');
  const [dueAt, setDueAt] = useState(task.due_at ?? '');
  const [attachments, setAttachments] = useState<GridAttachment[]>(task.attachments ?? []);
  const [uploading, setUploading] = useState(false);
  const [blockerOwnerPickerOpen, setBlockerOwnerPickerOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const overdue = isOverdue(dueAt);
  const blocked = !!blockedReason.trim();
  const blockerOwner = blockerOwnerId ? owners.find((o) => o.id === blockerOwnerId) : null;

  // Aggregated attachments across the project + every task under it
  const aggregatedFiles: Array<{ source: string; file: GridAttachment }> = [
    ...attachments.map((f) => ({ source: 'Project', file: f })),
    ...subtasks.flatMap((s) =>
      (s.attachments ?? []).map((f) => ({
        source: `Task · ${s.title || '(untitled)'}`,
        file: f,
      }))
    ),
  ];

  useEffect(() => {
    // Focus title only for newly-created empty projects
    if (!task.title) titleRef.current?.focus();
  }, [task.title]);

  const persist = async (changes: Partial<GridTask>) => {
    const { data, error } = await supabase
      .from('grid_tasks')
      .update(changes)
      .eq('id', task.id)
      .select()
      .single();
    if (error) {
      alert('Save failed: ' + error.message);
      return;
    }
    onLocalUpdate(data as GridTask);
  };

  const del = async () => {
    if (!confirm('Delete this project? All tasks under it will also be removed.')) return;
    const { error } = await supabase.from('grid_tasks').delete().eq('id', task.id);
    if (error) {
      alert('Delete failed: ' + error.message);
      return;
    }
    onDeleted(task.id);
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const path = `projects/${task.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from('grid-attachments')
        .upload(path, file, { cacheControl: '3600' });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('grid-attachments').getPublicUrl(path);
      const entry: GridAttachment = {
        name: file.name,
        url: pub.publicUrl,
        size: file.size,
        uploaded_at: new Date().toISOString(),
      };
      const next = [...attachments, entry];
      setAttachments(next);
      await persist({ attachments: next });
    } catch (e) {
      alert('Upload failed: ' + (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (index: number) => {
    const next = attachments.filter((_, i) => i !== index);
    setAttachments(next);
    await persist({ attachments: next });
  };

  return (
    <div
      style={{
        background: `linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.72)), ${laneColor}`,
        border: `1px solid ${laneColor}`,
        borderLeft: `4px solid ${laneColor}`,
        padding: '14px 16px 16px',
        marginBottom: 8,
        clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)',
        boxShadow: overdue
          ? `0 0 14px ${OVERDUE}66, inset 0 0 0 1px ${OVERDUE}66`
          : `0 0 12px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Header row: title + collapse */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const t = title.trim();
            if (t !== task.title) persist({ title: t });
          }}
          placeholder="Project name"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#f0fbff',
            fontFamily: 'inherit',
            fontSize: 17,
            fontWeight: 600,
            outline: 'none',
            padding: 0,
          }}
        />
        <button
          type="button"
          onClick={onCollapse}
          title="Collapse"
          style={collapseBtnStyle}
        >
          ↑
        </button>
      </div>

      {/* Description */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Notes</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => persist({ description: description.trim() || null })}
          rows={2}
          placeholder="Optional. What does done look like?"
          style={inputStyleNeutral()}
        />
      </div>

      {/* Meta row: due date + blocker toggle inline */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={labelStyle}>Due date</label>
          <input
            type="date"
            value={dueAt}
            onChange={(e) => {
              const v = e.target.value;
              setDueAt(v);
              persist({ due_at: v || null });
            }}
            style={{
              ...inputStyleNeutral(),
              width: 'auto',
              minWidth: 160,
              border: `1px solid ${overdue ? OVERDUE : CYAN_FAINT}`,
              color: overdue ? OVERDUE : '#e0f4f8',
              colorScheme: 'dark',
            }}
          />
        </div>
      </div>

      {/* Blocker */}
      <div style={{ marginBottom: 10 }}>
        <label
          style={{
            ...labelStyle,
            color: blocked ? '#ff2040aa' : CYAN_DIM,
          }}
        >
          Blocker (optional)
        </label>
        <textarea
          value={blockedReason}
          onChange={(e) => setBlockedReason(e.target.value)}
          onBlur={() => persist({ blocked_reason: blockedReason.trim() || null })}
          rows={2}
          placeholder="What's the question or dependency holding this up?"
          style={{
            ...inputStyleNeutral(),
            border: `1px solid ${blocked ? 'rgba(255,32,64,0.45)' : CYAN_FAINT}`,
          }}
        />
        {blocked && (
          <div style={{ marginTop: 6 }}>
            <OwnerCombobox
              owners={owners}
              selectedId={blockerOwnerId}
              variant="blocker"
              triggerLabel="+ Waiting on…"
              clearLabel="No one"
              onPick={(oid) => {
                setBlockerOwnerId(oid);
                persist({ blocker_owner_id: oid });
              }}
              onOwnerCreated={onOwnerAdded}
            />
          </div>
        )}
      </div>

      {/* Q&A / Notebook */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Q&amp;A · Notebook</label>
        <textarea
          value={qna}
          onChange={(e) => setQna(e.target.value)}
          onBlur={() => persist({ qna: qna.trim() || null })}
          rows={3}
          placeholder="Questions to research, open threads, stuff to ask — not blocking, just noted."
          style={inputStyleNeutral()}
        />
      </div>

      {/* Tasks (subtasks) */}
      <SubtaskList
        taskId={task.id}
        owners={owners}
        onOwnerAdded={onOwnerAdded}
        onSubtasksChanged={onSubtasksChanged}
      />

      {/* Attachments — project-level upload + aggregate view of everything */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Attachments · Project</label>
        <label
          style={{
            display: 'block',
            width: '100%',
            padding: '8px',
            background: 'transparent',
            border: `1px dashed ${CYAN_FAINT}`,
            color: CYAN_DIM,
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontWeight: 700,
            cursor: uploading ? 'wait' : 'pointer',
            textAlign: 'center',
            opacity: uploading ? 0.5 : 1,
          }}
        >
          {uploading ? 'Uploading…' : '+ Attach file to project'}
          <input
            type="file"
            style={{ display: 'none' }}
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {/* All files rollup — files on the project + every task under it */}
      {aggregatedFiles.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>All files · {aggregatedFiles.length}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {aggregatedFiles.map(({ source, file }, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  border: `1px solid ${CYAN_FAINT}`,
                  fontFamily: MONO,
                  fontSize: 11,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: source === 'Project' ? laneColor : CYAN_DIM,
                    minWidth: 90,
                  }}
                >
                  {source}
                </span>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, color: CYAN, textDecoration: 'underline', textUnderlineOffset: 2 }}
                >
                  {file.name}
                </a>
                {file.size != null && (
                  <span style={{ color: CYAN_DIM }}>{(file.size / 1024).toFixed(0)} KB</span>
                )}
                {source === 'Project' && (
                  <button
                    type="button"
                    onClick={() => {
                      const idx = attachments.findIndex((a) => a.url === file.url);
                      if (idx >= 0) removeAttachment(idx);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,96,96,0.6)',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer: delete */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
        <button
          type="button"
          onClick={del}
          style={{
            background: 'transparent',
            border: `1px solid rgba(255,96,96,0.4)`,
            color: 'rgba(255,96,96,0.75)',
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 700,
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
        <button
          type="button"
          onClick={onCollapse}
          style={{
            background: laneColor + '22',
            border: `1px solid ${laneColor}`,
            color: laneColor,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 700,
            padding: '6px 14px',
            cursor: 'pointer',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

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

function inputStyleNeutral(): React.CSSProperties {
  return {
    width: '100%',
    background: 'rgba(0,12,16,0.7)',
    border: `1px solid ${CYAN_FAINT}`,
    color: '#e0f4f8',
    padding: '8px 10px',
    fontFamily: 'inherit',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
  };
}

const collapseBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${CYAN_FAINT}`,
  color: CYAN_DIM,
  padding: '4px 8px',
  fontFamily: MONO,
  fontSize: 12,
  cursor: 'pointer',
  lineHeight: 1,
};

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _cyanUsedElsewhere = CYAN;
