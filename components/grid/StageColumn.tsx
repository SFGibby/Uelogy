'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import type { GridStage, GridTask, GridType } from '../../lib/supabase';

interface Props {
  stage: GridStage;
  tasks: GridTask[];
  types: GridType[];
  adminMode: boolean;
  savedById?: Record<string, number>;
  onTaskClick: (task: GridTask) => void;
  onQuickAdd?: (title: string) => Promise<void> | void;
  onDetailsClick?: () => void;
}

export default function StageColumn({
  stage,
  tasks,
  types,
  adminMode,
  savedById,
  onTaskClick,
  onQuickAdd,
  onDetailsClick,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const title = draft.trim();
    if (!title || busy) return;
    setBusy(true);
    try {
      await onQuickAdd?.(title);
      setDraft('');
      // stay in add-mode so user can type another in quick succession
    } finally {
      setBusy(false);
    }
  };
  const { setNodeRef, isOver } = useDroppable({ id: `stage:${stage.id}` });
  const typesById = Object.fromEntries(types.map((t) => [t.id, t]));

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: '1 1 300px',
        minWidth: 300,
        maxWidth: 560,
        background: isOver ? 'rgba(0,240,255,0.04)' : 'rgba(0, 0, 0, 0.5)',
        border: `1px solid ${stage.color}44`,
        padding: '14px 12px 16px',
        clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)',
        transition: 'background 0.15s',
        minHeight: 200,
        boxShadow: isOver ? `inset 0 0 0 1px ${stage.color}99` : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2px 6px 12px',
          borderBottom: `1px solid ${stage.color}55`,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 9,
              height: 9,
              background: stage.color,
              boxShadow: `0 0 8px ${stage.color}aa`,
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: stage.color,
              letterSpacing: '0.20em',
              textTransform: 'uppercase',
              fontWeight: 700,
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            {stage.name}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            color: 'rgba(0,240,255,0.5)',
            fontFamily: 'ui-monospace, monospace',
            fontWeight: 700,
          }}
        >
          {tasks.length.toString().padStart(2, '0')}
        </span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            type={task.type_id ? typesById[task.type_id] : undefined}
            adminMode={adminMode}
            saved={savedById?.[task.id]}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </SortableContext>

      {tasks.length === 0 && (
        <div
          style={{
            color: 'rgba(0,240,255,0.3)',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            textAlign: 'center',
            padding: '14px 0',
          }}
        >
          // empty
        </div>
      )}

      {adminMode && !adding && (
        <button
          onClick={() => setAdding(true)}
          style={{
            width: '100%',
            marginTop: 6,
            padding: '10px',
            background: 'transparent',
            border: `1px dashed ${stage.color}66`,
            color: stage.color,
            fontFamily: 'ui-monospace, monospace',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${stage.color}11`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          + Add task
        </button>
      )}

      {adminMode && adding && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            autoFocus
            type="text"
            value={draft}
            disabled={busy}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              } else if (e.key === 'Escape') {
                setAdding(false);
                setDraft('');
              }
            }}
            placeholder="Name it — Enter to add, Esc to close"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(0,12,16,0.85)',
              border: `1px solid ${stage.color}`,
              color: '#f0fbff',
              fontFamily: 'inherit',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
              opacity: busy ? 0.5 : 1,
            }}
          />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={onDetailsClick}
              style={{
                background: 'transparent',
                border: `1px solid rgba(0,240,255,0.25)`,
                color: 'rgba(0,240,255,0.7)',
                padding: '5px 10px',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              + Details
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setDraft('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(0,240,255,0.4)',
                padding: '5px 10px',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
