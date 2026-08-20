'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { supabase } from '../../lib/supabase';
import type { GridStage, GridType, GridTask, GridTaskSavings, GridSubtask } from '../../lib/supabase';
import StageColumn from './StageColumn';
import TaskCard from './TaskCard';
import TaskEditModal from './TaskEditModal';
import StageManager from './StageManager';
import TypeManager from './TypeManager';
import BlockersLane from './BlockersLane';
import NotebookPanel from './NotebookPanel';

interface Props {
  adminMode: boolean;
  openStageManager?: boolean;
  openTypeManager?: boolean;
  onStageManagerClose?: () => void;
  onTypeManagerClose?: () => void;
}

const CYAN_DIM = 'rgba(0,240,255,0.55)';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function KanbanBoard({
  adminMode,
  openStageManager,
  openTypeManager,
  onStageManagerClose,
  onTypeManagerClose,
}: Props) {
  const [stages, setStages] = useState<GridStage[]>([]);
  const [types, setTypes] = useState<GridType[]>([]);
  const [tasks, setTasks] = useState<GridTask[]>([]);
  const [savedById, setSavedById] = useState<Record<string, number>>({});
  const [subtasks, setSubtasks] = useState<GridSubtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<GridTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  // In-place expansion state: which project is currently expanded in its lane
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  // Legacy modal state — kept as a fallback path but no longer used for click-to-edit
  const [editing, setEditing] = useState<GridTask | null>(null);
  const [creatingInStage, setCreatingInStage] = useState<string | null>(null);
  const [creatingDraftTitle, setCreatingDraftTitle] = useState<string>('');
  // Manager visibility is now controlled by the parent (GridKanbanView).
  const showStageManager = !!openStageManager;
  const showTypeManager = !!openTypeManager;
  const closeStageManager = () => onStageManagerClose?.();
  const closeTypeManager = () => onTypeManagerClose?.();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [s, t, k, sg, st] = await Promise.all([
      supabase.from('grid_stages').select('*').order('position'),
      supabase.from('grid_types').select('*').order('created_at'),
      supabase.from('grid_tasks').select('*').order('position'),
      supabase.from('grid_task_savings').select('*'),
      supabase.from('grid_subtasks').select('*').order('position'),
    ]);
    setSubtasks((st.data as GridSubtask[]) ?? []);
    if (s.error || t.error || k.error) {
      setError(s.error?.message ?? t.error?.message ?? k.error?.message ?? 'unknown error');
    }
    setStages((s.data as GridStage[]) ?? []);
    setTypes((t.data as GridType[]) ?? []);
    setTasks((k.data as GridTask[]) ?? []);
    // savings view may not exist yet if Sam hasn't run the budget migration; ignore that error.
    const savingsRows = (sg.data as GridTaskSavings[]) ?? [];
    setSavedById(
      Object.fromEntries(savingsRows.map((r) => [r.grid_task_id, Number(r.saved)]))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tasksByStage = stages.reduce<Record<string, GridTask[]>>((acc, s) => {
    acc[s.id] = tasks
      .filter((t) => t.stage_id === s.id)
      .sort((a, b) => a.position - b.position);
    return acc;
  }, {});

  // Aggregates per project: task counts, worst task priority, blocker count.
  const subtaskCounts: Record<string, { total: number; done: number }> = {};
  const subtaskWorstPriority: Record<string, number | null> = {};
  const subtaskBlockerCount: Record<string, number> = {};
  const subtasksByProject: Record<string, typeof subtasks> = {};
  for (const st of subtasks) {
    (subtasksByProject[st.task_id] = subtasksByProject[st.task_id] || []).push(st);
    const c = subtaskCounts[st.task_id] || { total: 0, done: 0 };
    c.total += 1;
    if (st.done) c.done += 1;
    subtaskCounts[st.task_id] = c;

    const worst = subtaskWorstPriority[st.task_id];
    // Reversed: priority 3 is worst (Critical); higher number = worse.
    if (worst == null || st.priority > worst) subtaskWorstPriority[st.task_id] = st.priority;

    if (st.blocked_reason?.trim()) {
      subtaskBlockerCount[st.task_id] = (subtaskBlockerCount[st.task_id] ?? 0) + 1;
    }
  }

  const openCreateModal = (stageId: string, draftTitle = '') => {
    setEditing(null);
    setCreatingDraftTitle(draftTitle);
    setCreatingInStage(stageId);
  };

  const openEditModal = (task: GridTask) => {
    if (!adminMode) return;
    // In-place expansion instead of modal
    setExpandedTaskId(task.id);
  };

  const closeModal = () => {
    setEditing(null);
    setCreatingInStage(null);
    setCreatingDraftTitle('');
  };

  const handleSaved = (task: GridTask) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id);
      if (idx === -1) return [...prev, task];
      const next = [...prev];
      next[idx] = task;
      return next;
    });
  };

  const handleDeleted = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleQuickAdd = async (stageId: string, title: string): Promise<GridTask | null> => {
    const list = tasksByStage[stageId] ?? [];
    const nextPos = list.reduce((m, t) => Math.max(m, t.position), -1) + 1;
    const { data, error } = await supabase
      .from('grid_tasks')
      .insert({
        title,
        stage_id: stageId,
        priority: 3,
        position: nextPos,
        links: [],
      })
      .select()
      .single();
    if (error) {
      alert('Quick add failed: ' + error.message);
      return null;
    }
    const created = data as GridTask;
    setTasks((prev) => [...prev, created]);
    return created;
  };

  const createAndExpand = async (stageId: string, draftTitle: string) => {
    const created = await handleQuickAdd(stageId, draftTitle || 'Untitled project');
    if (created) setExpandedTaskId(created.id);
  };

  const handleDragStart = (e: DragStartEvent) => {
    const task = tasks.find((t) => t.id === e.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const activeTaskObj = tasks.find((t) => t.id === active.id);
    if (!activeTaskObj) return;

    // Resolve target stage + insertion index
    let targetStageId: string | null = null;
    let targetIndex = 0;
    const overIdStr = String(over.id);

    if (overIdStr.startsWith('stage:')) {
      targetStageId = overIdStr.slice('stage:'.length);
      targetIndex = (tasksByStage[targetStageId] ?? []).length;
    } else {
      const overTask = tasks.find((t) => t.id === overIdStr);
      if (!overTask) return;
      targetStageId = overTask.stage_id ?? null;
      const list = tasksByStage[targetStageId ?? ''] ?? [];
      const idx = list.findIndex((t) => t.id === overIdStr);
      targetIndex = idx === -1 ? list.length : idx;
    }

    if (!targetStageId) return;

    const sourceStageId = activeTaskObj.stage_id;
    const sameColumn = sourceStageId === targetStageId;

    // Build optimistic new task list with reindexed positions in both columns
    const next = [...tasks];
    const activeIdx = next.findIndex((t) => t.id === activeTaskObj.id);
    next[activeIdx] = { ...activeTaskObj, stage_id: targetStageId };

    const sourceList = next
      .filter((t) => t.stage_id === sourceStageId && t.id !== activeTaskObj.id)
      .sort((a, b) => a.position - b.position);
    const targetList = sameColumn
      ? sourceList
      : next
          .filter((t) => t.stage_id === targetStageId && t.id !== activeTaskObj.id)
          .sort((a, b) => a.position - b.position);

    targetList.splice(targetIndex, 0, next[activeIdx]);

    const updates: { id: string; stage_id: string; position: number }[] = [];
    targetList.forEach((t, i) => {
      if (t.position !== i || t.stage_id !== targetStageId) {
        const refIdx = next.findIndex((x) => x.id === t.id);
        next[refIdx] = { ...t, stage_id: targetStageId, position: i };
        updates.push({ id: t.id, stage_id: targetStageId, position: i });
      }
    });
    if (!sameColumn && sourceStageId) {
      sourceList.forEach((t, i) => {
        if (t.position !== i) {
          const refIdx = next.findIndex((x) => x.id === t.id);
          next[refIdx] = { ...t, position: i };
          updates.push({ id: t.id, stage_id: sourceStageId, position: i });
        }
      });
    }

    setTasks(next);

    for (const u of updates) {
      const { error } = await supabase
        .from('grid_tasks')
        .update({ stage_id: u.stage_id, position: u.position })
        .eq('id', u.id);
      if (error) {
        console.error('move persist failed', error);
        // Best-effort: reload the canonical state on any failure
        load();
        return;
      }
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          color: CYAN_DIM,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: '0.22em',
        }}
      >
        LOADING BOARD…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '24px 28px',
          color: '#ff7060',
          fontFamily: MONO,
          fontSize: 12,
          border: '1px solid rgba(255,112,96,0.4)',
          background: 'rgba(40,8,8,0.5)',
        }}
      >
        <div style={{ letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
          Connection Error
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,200,200,0.85)' }}>{error}</div>
        <div style={{ fontSize: 11, marginTop: 10, color: 'rgba(255,200,200,0.55)' }}>
          If this is your first visit: run <code>supabase/grid-schema.sql</code> in the Supabase SQL editor to create the tables.
        </div>
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div
        style={{
          padding: '24px 28px',
          color: CYAN_DIM,
          fontFamily: MONO,
          fontSize: 12,
          border: '1px solid rgba(0,240,255,0.3)',
        }}
      >
        <div style={{ letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
          No Stages
        </div>
        <div style={{ fontSize: 13, color: 'rgba(0,240,255,0.8)' }}>
          Run <code>supabase/grid-schema.sql</code> in the Supabase SQL editor to seed default stages.
        </div>
      </div>
    );
  }

  const toolbarBtn: React.CSSProperties = {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    background: 'transparent',
    color: CYAN_DIM,
    border: '1px solid rgba(0,240,255,0.3)',
    padding: '7px 12px',
    cursor: 'pointer',
  };

  return (
    <>
      <BlockersLane
        tasks={tasks}
        types={types}
        onTaskClick={openEditModal}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 20 }}>
          {stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              tasks={tasksByStage[stage.id] ?? []}
              types={types}
              adminMode={adminMode}
              savedById={savedById}
              subtaskCounts={subtaskCounts}
              subtaskWorstPriority={subtaskWorstPriority}
              subtaskBlockerCount={subtaskBlockerCount}
              expandedTaskId={expandedTaskId}
              subtasksByProject={subtasksByProject}
              onTaskClick={openEditModal}
              onCollapse={() => setExpandedTaskId(null)}
              onLocalUpdate={handleSaved}
              onDeleted={handleDeleted}
              onOwnerAdded={(o) => setTypes((prev) => [...prev, o])}
              onSubtasksChanged={(projectId, rows) => {
                setSubtasks((prev) => {
                  const others = prev.filter((s) => s.task_id !== projectId);
                  return [...others, ...rows];
                });
              }}
              onQuickAdd={adminMode ? (title) => handleQuickAdd(stage.id, title) : undefined}
              onDetailsClick={
                adminMode
                  ? (draftTitle) => createAndExpand(stage.id, draftTitle)
                  : undefined
              }
            />
          ))}
        </div>
        {/* wrap: DragOverlay after columns */}
        <DragOverlay>
          {activeTask && (
            <TaskCard
              task={activeTask}
              type={types.find((t) => t.id === activeTask.type_id)}
              laneColor={stages.find((s) => s.id === activeTask.stage_id)?.color}
              adminMode={true}
              preview
            />
          )}
        </DragOverlay>
      </DndContext>

      <NotebookPanel />

      {(editing !== null || creatingInStage !== null) && (
        <TaskEditModal
          task={editing}
          defaultStageId={creatingInStage}
          draftTitle={creatingDraftTitle}
          stages={stages}
          types={types}
          laneColor={
            (editing
              ? stages.find((s) => s.id === editing.stage_id)?.color
              : stages.find((s) => s.id === creatingInStage)?.color) ?? undefined
          }
          onClose={closeModal}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onOwnerAdded={(o) => setTypes((prev) => [...prev, o])}
        />
      )}

      {showStageManager && (
        <StageManager
          stages={stages}
          onChange={setStages}
          onClose={closeStageManager}
        />
      )}

      {showTypeManager && (
        <TypeManager
          types={types}
          onChange={setTypes}
          onClose={closeTypeManager}
        />
      )}
    </>
  );
}
