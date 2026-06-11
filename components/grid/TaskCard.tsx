'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GridTask, GridType } from '../../lib/supabase';

interface Props {
  task: GridTask;
  type?: GridType;
  adminMode: boolean;
  saved?: number;
  onClick?: () => void;
  // When true, the card renders as a static preview (e.g. DragOverlay) and
  // doesn't register itself with dnd-kit. Prevents duplicate-ref issues.
  preview?: boolean;
}

export default function TaskCard({ task, type, adminMode, saved, onClick, preview = false }: Props) {
  // Always call the hook — pass a non-conflicting id when preview, then ignore the result
  const sortable = useSortable({
    id: preview ? `preview-${task.id}` : task.id,
    disabled: !adminMode || preview,
  });

  const ref = preview ? undefined : sortable.setNodeRef;
  const transform = preview ? null : sortable.transform;
  const transition = preview ? undefined : sortable.transition;
  const isDragging = preview ? false : sortable.isDragging;
  const accent = type?.color ?? '#00f0ff';

  const draggableHandlers =
    adminMode && !preview ? { ...sortable.attributes, ...sortable.listeners } : {};

  return (
    <div
      ref={ref}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        background: 'rgba(0, 16, 22, 0.85)',
        border: `1px solid rgba(0,240,255,0.22)`,
        borderLeft: `3px solid ${accent}`,
        padding: '12px 14px 11px',
        marginBottom: 8,
        cursor: adminMode && !preview ? 'grab' : onClick ? 'pointer' : 'default',
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
        boxShadow: preview
          ? `0 0 24px ${accent}, 0 0 0 1px ${accent}`
          : '0 1px 3px rgba(0,0,0,0.4)',
        color: '#cfe9f0',
        fontFamily: 'inherit',
        userSelect: 'none',
      }}
      onClick={preview ? undefined : onClick}
      {...draggableHandlers}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0fbff', lineHeight: 1.35 }}>
        {task.title}
      </div>

      {(type || task.due_at) && (
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          {type && (
            <span
              style={{
                fontSize: 9,
                color: accent,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              {type.name}
            </span>
          )}
          {task.due_at && (
            <span
              style={{
                fontSize: 10,
                color: 'rgba(0,240,255,0.5)',
                letterSpacing: '0.06em',
              }}
            >
              · {new Date(task.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      )}

      {task.cost != null && task.cost > 0 && (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              fontSize: 10,
              fontFamily: 'ui-monospace, monospace',
              color: 'rgba(0,255,127,0.85)',
              letterSpacing: '0.06em',
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <span>SAVINGS</span>
            <span>
              ${(saved ?? 0).toFixed(0)} / ${Number(task.cost).toFixed(0)}
            </span>
          </div>
          <div
            style={{
              height: 4,
              background: 'rgba(0,255,127,0.12)',
              border: '1px solid rgba(0,255,127,0.3)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: `${Math.min(100, ((saved ?? 0) / Number(task.cost)) * 100)}%`,
                background: '#00ff7f',
                boxShadow: '0 0 6px rgba(0,255,127,0.7)',
              }}
            />
          </div>
        </div>
      )}

      {task.links && task.links.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {task.links.map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: 10,
                fontFamily: 'ui-monospace, monospace',
                color: 'rgba(0,240,255,0.6)',
                textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
