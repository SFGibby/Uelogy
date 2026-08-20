'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GridTask, GridType, GridPriority } from '../../lib/supabase';

const BLOCKER_RED = '#ff2040';
const OVERDUE = '#ff2040';

// Reversed convention (Sam-style, 2026-08-20):
// P3 = Critical (worst / highest), P0 = Low (best / lowest)
const PRIORITY_META: Record<GridPriority, { color: string; label: string }> = {
  0: { color: '#5a6a7a', label: 'P0' },
  1: { color: '#f0a000', label: 'P1' },
  2: { color: '#00f0ff', label: 'P2' },
  3: { color: '#ff2040', label: 'P3' },
};

interface Props {
  task: GridTask;
  type?: GridType;
  laneColor?: string;
  adminMode: boolean;
  saved?: number;
  subtaskTotal?: number;
  subtaskDone?: number;
  subtaskWorstPriority?: GridPriority | null;
  subtaskBlockerCount?: number;
  onClick?: () => void;
  preview?: boolean;
}

function isOverdue(due_at?: string | null): boolean {
  if (!due_at) return false;
  const d = new Date(due_at + 'T23:59:59');
  return d.getTime() < Date.now();
}

export default function TaskCard({
  task,
  type,
  laneColor,
  adminMode,
  subtaskTotal = 0,
  subtaskDone = 0,
  subtaskWorstPriority = null,
  subtaskBlockerCount = 0,
  onClick,
  preview = false,
}: Props) {
  const [showBlocker, setShowBlocker] = useState(false);
  const blocked = !!task.blocked_reason?.trim();
  const overdue = isOverdue(task.due_at);

  const sortable = useSortable({
    id: preview ? `preview-${task.id}` : task.id,
    disabled: !adminMode || preview,
  });

  const ref = preview ? undefined : sortable.setNodeRef;
  const transform = preview ? null : sortable.transform;
  const transition = preview ? undefined : sortable.transition;
  const isDragging = preview ? false : sortable.isDragging;
  // The card chrome follows the lane, not the (hidden) owner.
  const accent = laneColor ?? type?.color ?? '#00f0ff';

  const draggableHandlers =
    adminMode && !preview ? { ...sortable.attributes, ...sortable.listeners } : {};

  // Difficulty = worst subtask priority + total blocker count on the whole project
  const totalBlockers = subtaskBlockerCount + (blocked ? 1 : 0);
  const diffMeta = subtaskWorstPriority !== null ? PRIORITY_META[subtaskWorstPriority] : null;
  const showDiffChip = diffMeta !== null || totalBlockers > 0;

  return (
    <div
      ref={ref}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        background: `linear-gradient(rgba(0,0,0,0.62), rgba(0,0,0,0.62)), ${accent}`,
        border: `1px solid ${accent}`,
        borderLeft: `4px solid ${accent}`,
        padding: '12px 14px 11px',
        marginBottom: 8,
        cursor: adminMode && !preview ? 'grab' : onClick ? 'pointer' : 'default',
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
        boxShadow: preview
          ? `0 0 24px ${accent}, 0 0 0 1px ${accent}`
          : overdue
          ? `0 0 12px ${OVERDUE}55, inset 0 0 0 1px ${OVERDUE}55`
          : '0 1px 3px rgba(0,0,0,0.4)',
        color: '#f5f5f5',
        fontFamily: 'inherit',
        userSelect: 'none',
      }}
      onClick={preview ? undefined : onClick}
      {...draggableHandlers}
    >
      {/* Meta row: difficulty rollup + due date + blocker flag */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'ui-monospace, monospace',
          marginBottom: 6,
          flexWrap: 'wrap',
        }}
      >
        {showDiffChip && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: diffMeta?.color ?? '#5a6a7a',
              border: `1px solid ${(diffMeta?.color ?? '#5a6a7a')}66`,
              padding: '2px 5px',
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Difficulty: worst task priority · blockers"
          >
            {diffMeta ? diffMeta.label : 'P3'}
            {totalBlockers > 0 && (
              <span style={{ color: BLOCKER_RED }}>· ⚑{totalBlockers}</span>
            )}
          </span>
        )}
        {task.due_at && (
          <span
            style={{
              fontSize: 10,
              color: overdue ? OVERDUE : `${accent}bb`,
              letterSpacing: '0.06em',
            }}
          >
            {new Date(task.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {blocked && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowBlocker((v) => !v);
            }}
            title={showBlocker ? 'Hide blocker' : 'Show blocker'}
            style={{
              marginLeft: 'auto',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11,
              color: BLOCKER_RED,
              border: `1px solid ${BLOCKER_RED}66`,
              background: showBlocker ? `${BLOCKER_RED}22` : 'transparent',
              padding: '2px 6px',
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            ⚑
          </button>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0fbff', lineHeight: 1.35 }}>
        {task.title}
      </div>

      {subtaskTotal > 0 && (
        <div
          style={{
            marginTop: 6,
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10,
            color: subtaskDone === subtaskTotal ? '#00ff7f' : `${accent}cc`,
            letterSpacing: '0.08em',
          }}
        >
          [{subtaskDone}/{subtaskTotal}] tasks
        </div>
      )}

      {blocked && showBlocker && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 10px',
            border: `1px solid ${BLOCKER_RED}55`,
            background: 'rgba(255,32,64,0.06)',
            color: '#f6c8cf',
            fontSize: 12,
            lineHeight: 1.4,
            fontFamily: 'inherit',
            whiteSpace: 'pre-wrap',
          }}
        >
          {task.blocked_reason}
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
                color: `${accent}cc`,
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
