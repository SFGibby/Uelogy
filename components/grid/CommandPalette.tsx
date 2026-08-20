'use client';

// Cmd+K global search. Fuzzy-ish substring match across projects, tasks,
// and owner names. Enter picks the highlighted result and jumps to the
// project (expanding it).

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GridTask, GridSubtask, GridType, GridStage } from '../../lib/supabase';

interface Props {
  tasks: GridTask[];
  subtasks: GridSubtask[];
  owners: GridType[];
  stages: GridStage[];
  onSelectProject: (taskId: string) => void;
  onClose: () => void;
}

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const CYAN_FAINT = 'rgba(0,240,255,0.22)';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

type Result =
  | { kind: 'project'; task: GridTask; label: string; sub: string }
  | { kind: 'task'; task: GridTask; subtask: GridSubtask; label: string; sub: string }
  | { kind: 'owner'; owner: GridType; count: number; label: string; sub: string };

export default function CommandPalette({
  tasks,
  subtasks,
  owners,
  stages,
  onSelectProject,
  onClose,
}: Props) {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const stageById = useMemo(
    () => Object.fromEntries(stages.map((s) => [s.id, s])),
    [stages]
  );
  const tasksById = useMemo(
    () => Object.fromEntries(tasks.map((t) => [t.id, t])),
    [tasks]
  );

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return tasks.slice(0, 10).map((t) => ({
        kind: 'project',
        task: t,
        label: t.title || '(untitled)',
        sub: stageById[t.stage_id ?? '']?.name ?? '',
      }));
    }
    const matches: Result[] = [];
    for (const t of tasks) {
      if ((t.title || '').toLowerCase().includes(q)) {
        matches.push({
          kind: 'project',
          task: t,
          label: t.title || '(untitled)',
          sub: stageById[t.stage_id ?? '']?.name ?? '',
        });
      }
    }
    for (const s of subtasks) {
      if ((s.title || '').toLowerCase().includes(q)) {
        const parent = tasksById[s.task_id];
        if (!parent) continue;
        matches.push({
          kind: 'task',
          task: parent,
          subtask: s,
          label: s.title,
          sub: `Task under ${parent.title || '(untitled)'}`,
        });
      }
    }
    for (const o of owners) {
      if (o.name.toLowerCase().includes(q)) {
        const owned = tasks.filter((t) => t.type_id === o.id).length +
          subtasks.filter((st) => st.owner_id === o.id).length;
        matches.push({
          kind: 'owner',
          owner: o,
          count: owned,
          label: o.name,
          sub: `Owner · ${owned} assignment${owned === 1 ? '' : 's'}`,
        });
      }
    }
    return matches.slice(0, 25);
  }, [query, tasks, subtasks, owners, stageById, tasksById]);

  useEffect(() => {
    if (highlight >= results.length) setHighlight(0);
  }, [results.length, highlight]);

  const pick = (r: Result) => {
    if (r.kind === 'owner') {
      // Owner has no direct target — jump to first assigned project as a start.
      const first = tasks.find((t) => t.type_id === r.owner.id) ??
        (r.kind === 'owner' && subtasks.find((st) => st.owner_id === r.owner.id) && tasksById[subtasks.find((st) => st.owner_id === r.owner.id)!.task_id]);
      if (first) onSelectProject((first as GridTask).id);
      onClose();
      return;
    }
    onSelectProject(r.task.id);
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[highlight]) pick(results[highlight]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#020608',
          border: `1px solid ${CYAN}88`,
          width: '100%',
          maxWidth: 640,
          maxHeight: '70vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#e0f4f8',
          fontFamily: MONO,
          boxShadow: `0 0 40px rgba(0,240,255,0.2)`,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
          }}
          onKeyDown={handleKey}
          placeholder="Search projects, tasks, owners…"
          style={{
            width: '100%',
            padding: '14px 18px',
            background: 'transparent',
            border: 'none',
            borderBottom: `1px solid ${CYAN_FAINT}`,
            color: '#f5f5f5',
            fontFamily: 'inherit',
            fontSize: 15,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {results.length === 0 ? (
            <div style={{ padding: '20px 18px', color: CYAN_DIM, fontSize: 13 }}>No matches.</div>
          ) : (
            results.map((r, i) => {
              const active = i === highlight;
              const accent =
                r.kind === 'project' && r.task.stage_id
                  ? stageById[r.task.stage_id]?.color ?? CYAN
                  : r.kind === 'task'
                  ? stageById[r.task.stage_id ?? '']?.color ?? CYAN
                  : r.kind === 'owner'
                  ? r.owner.color
                  : CYAN;
              const kindLabel =
                r.kind === 'project' ? 'PROJECT' : r.kind === 'task' ? 'TASK' : 'OWNER';
              return (
                <div
                  key={`${r.kind}-${i}`}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(r)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 18px',
                    background: active ? 'rgba(0,240,255,0.10)' : 'transparent',
                    borderLeft: `3px solid ${active ? accent : 'transparent'}`,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.22em',
                      color: accent,
                      minWidth: 60,
                    }}
                  >
                    {kindLabel}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: '#f5f5f5',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.label}
                    </div>
                    <div style={{ color: CYAN_DIM, fontSize: 10, marginTop: 2 }}>{r.sub}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 14,
            padding: '8px 18px',
            borderTop: `1px solid ${CYAN_FAINT}`,
            color: CYAN_DIM,
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <span>↑↓ Navigate</span>
          <span>⏎ Open</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
