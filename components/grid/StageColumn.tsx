'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import type { GridStage, GridTask, GridType } from '../../lib/supabase';

interface Props {
  stage: GridStage;
  tasks: GridTask[];
  types: GridType[];
  adminMode: boolean;
  onTaskClick: (task: GridTask) => void;
  onAddClick?: () => void;
}

export default function StageColumn({
  stage,
  tasks,
  types,
  adminMode,
  onTaskClick,
  onAddClick,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage:${stage.id}` });
  const typesById = Object.fromEntries(types.map((t) => [t.id, t]));

  return (
    <div
      ref={setNodeRef}
      style={{
        flexShrink: 0,
        width: 300,
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

      {adminMode && onAddClick && (
        <button
          onClick={onAddClick}
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
    </div>
  );
}
