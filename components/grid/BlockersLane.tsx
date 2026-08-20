'use client';

// BlockersLane — every project whose blocked_reason is set, listed as
// compact one-liners at the top. Click a row to reveal the full text.
// Auto-hides when nothing is blocked.

import { useState } from 'react';
import type { GridTask, GridType, GridPriority } from '../../lib/supabase';

interface Props {
  tasks: GridTask[];
  types: GridType[];
  onTaskClick: (task: GridTask) => void;
}

const BLOCKER_RED = '#ff2040';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

// Reversed convention: P3 = Critical, P0 = Low.
const PRIORITY_META: Record<GridPriority, { color: string; label: string }> = {
  0: { color: '#5a6a7a', label: 'P0' },
  1: { color: '#f0a000', label: 'P1' },
  2: { color: '#00f0ff', label: 'P2' },
  3: { color: '#e91e63', label: 'P3' },
};

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function BlockersLane({ tasks, types, onTaskClick }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const blocked = tasks
    .filter((t) => t.blocked_reason?.trim())
    .sort((a, b) => b.priority - a.priority);

  if (blocked.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: 14,
        border: `1px solid ${BLOCKER_RED}55`,
        background: 'rgba(255,32,64,0.04)',
        padding: '6px 10px 8px',
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
      }}
    >
      {/* Header — click to collapse the entire lane. No button, no words. */}
      <div
        onClick={() => setCollapsed((v) => !v)}
        style={{
          fontFamily: MONO,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.3em',
          color: BLOCKER_RED,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '4px 2px',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            background: BLOCKER_RED,
            boxShadow: `0 0 6px ${BLOCKER_RED}`,
          }}
        />
        BLOCKERS · {blocked.length}
      </div>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
          {blocked.map((t) => {
            const pMeta = PRIORITY_META[t.priority] ?? PRIORITY_META[3];
            const waitingOwner = t.blocker_owner_id
              ? types.find((x) => x.id === t.blocker_owner_id)
              : null;
            const firstLine = (t.blocked_reason ?? '').split('\n')[0];
            const due = formatDate(t.due_at);
            const expanded = openId === t.id;

            return (
              <div
                key={t.id}
                style={{
                  border: `1px solid ${BLOCKER_RED}44`,
                  background: 'rgba(0,0,0,0.35)',
                }}
              >
                {/* One-line row — click toggles expand */}
                <div
                  onClick={() => setOpenId(expanded ? null : t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontFamily: MONO,
                    fontSize: 11,
                    color: '#f5f5f5',
                    minHeight: 28,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: pMeta.color,
                      border: `1px solid ${pMeta.color}66`,
                      padding: '1px 5px',
                      lineHeight: 1,
                      flex: '0 0 auto',
                    }}
                  >
                    {pMeta.label}
                  </span>
                  <span
                    style={{
                      color: '#f0fbff',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 200,
                      fontSize: 12,
                    }}
                  >
                    {t.title || '(untitled)'}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      color: '#f6c8cf',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      opacity: 0.85,
                    }}
                  >
                    {firstLine}
                  </span>
                  {due && (
                    <span
                      style={{
                        color: '#f6c8cf',
                        opacity: 0.7,
                        letterSpacing: '0.06em',
                        fontSize: 10,
                        flex: '0 0 auto',
                      }}
                    >
                      {due}
                    </span>
                  )}
                  {waitingOwner && (
                    <span
                      style={{
                        fontSize: 9,
                        color: waitingOwner.color,
                        border: `1px solid ${waitingOwner.color}66`,
                        padding: '1px 5px',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        lineHeight: 1,
                        flex: '0 0 auto',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Waiting · {waitingOwner.name}
                    </span>
                  )}
                </div>
                {/* Expanded — full text + jump to project */}
                {expanded && (
                  <div
                    style={{
                      padding: '8px 12px 10px',
                      borderTop: `1px solid ${BLOCKER_RED}33`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: '#f6c8cf',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5,
                        fontFamily: 'inherit',
                      }}
                    >
                      {t.blocked_reason}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(t);
                        }}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${BLOCKER_RED}77`,
                          color: BLOCKER_RED,
                          fontFamily: MONO,
                          fontSize: 9,
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          padding: '5px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        Open project
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
