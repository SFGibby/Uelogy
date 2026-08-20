'use client';

// BlockersLane — surfaces every task whose blocked_reason is set.
// Renders as a horizontal strip above the kanban columns.
// Auto-hides when nothing is blocked.

import type { GridTask, GridType, GridPriority } from '../../lib/supabase';

interface Props {
  tasks: GridTask[];
  types: GridType[];
  onTaskClick: (task: GridTask) => void;
}

const BLOCKER_RED = '#ff2040';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

// Reversed convention (Sam-style, 2026-08-20): P3 = Critical, P0 = Low
const PRIORITY_META: Record<GridPriority, { color: string; label: string }> = {
  0: { color: '#5a6a7a', label: 'P0' },
  1: { color: '#f0a000', label: 'P1' },
  2: { color: '#00f0ff', label: 'P2' },
  3: { color: '#ff2040', label: 'P3' },
};

export default function BlockersLane({ tasks, types, onTaskClick }: Props) {
  const blocked = tasks
    .filter((t) => t.blocked_reason?.trim())
    // Reversed priority: higher number = higher urgency, sort desc.
    .sort((a, b) => b.priority - a.priority);

  if (blocked.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: 18,
        border: `1px solid ${BLOCKER_RED}55`,
        background: 'rgba(255,32,64,0.04)',
        padding: '12px 14px 14px',
        clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)',
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.3em',
          color: BLOCKER_RED,
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            background: BLOCKER_RED,
            boxShadow: `0 0 6px ${BLOCKER_RED}`,
          }}
        />
        BLOCKERS · {blocked.length}
      </div>

      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {blocked.map((t) => {
          const owner = types.find((x) => x.id === t.type_id);
          const pMeta = PRIORITY_META[t.priority] ?? PRIORITY_META[3];
          return (
            <button
              type="button"
              key={t.id}
              onClick={() => onTaskClick(t)}
              style={{
                textAlign: 'left',
                minWidth: 220,
                maxWidth: 320,
                flex: '0 0 auto',
                background: 'rgba(0, 16, 22, 0.85)',
                border: `1px solid ${BLOCKER_RED}55`,
                borderLeft: `3px solid ${owner?.color ?? '#00f0ff'}`,
                padding: '10px 12px',
                color: '#cfe9f0',
                cursor: 'pointer',
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  fontFamily: MONO,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: pMeta.color,
                    border: `1px solid ${pMeta.color}66`,
                    padding: '2px 5px',
                    lineHeight: 1,
                  }}
                >
                  {pMeta.label}
                </span>
                {owner && (
                  <span
                    style={{
                      fontSize: 9,
                      color: owner.color,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    {owner.name}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f0fbff', lineHeight: 1.35 }}>
                {t.title}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: '#f6c8cf',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {t.blocked_reason}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
