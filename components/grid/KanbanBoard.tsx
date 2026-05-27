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
import type { GridStage, GridType, GridTask } from '../../lib/supabase';
import StageColumn from './StageColumn';
import TaskCard from './TaskCard';
import TaskEditModal from './TaskEditModal';
import StageManager from './StageManager';
import TypeManager from './TypeManager';

interface Props {
  adminMode: boolean;
}

const CYAN_DIM = 'rgba(0,240,255,0.55)';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function KanbanBoard({ adminMode }: Props) {
  const [stages, setStages] = useState<GridStage[]>([]);
  const [types, setTypes] = useState<GridType[]>([]);
  const [tasks, setTasks] = useState<GridTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<GridTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Modal state: editing an existing task OR creating in a specific stage
  const [editing, setEditing] = useState<GridTask | null>(null);
  const [creatingInStage, setCreatingInStage] = useState<string | null>(null);
  // Manager modal flags
  const [showStageManager, setShowStageManager] = useState(false);
  const [showTypeManager, setShowTypeManager] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [s, t, k] = await Promise.all([
      supabase.from('grid_stages').select('*').order('position'),
      supabase.from('grid_types').select('*').order('created_at'),
      supabase.from('grid_tasks').select('*').order('position'),
    ]);
    if (s.error || t.error || k.error) {
      setError(s.error?.message ?? t.error?.message ?? k.error?.message ?? 'unknown error');
    }
    setStages((s.data as GridStage[]) ?? []);
    setTypes((t.data as GridType[]) ?? []);
    setTasks((k.data as GridTask[]) ?? []);
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

  const openCreateModal = (stageId: string) => {
    setEditing(null);
    setCreatingInStage(stageId);
  };

  const openEditModal = (task: GridTask) => {
    if (!adminMode) return;
    setCreatingInStage(null);
    setEditing(task);
  };

  const closeModal = () => {
    setEditing(null);
    setCreatingInStage(null);
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
      {adminMode && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button type="button" onClick={() => setShowStageManager(true)} style={toolbarBtn}>
            Manage Stages
          </button>
          <button type="button" onClick={() => setShowTypeManager(true)} style={toolbarBtn}>
            Manage Types
          </button>
        </div>
      )}

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
              onTaskClick={openEditModal}
              onAddClick={adminMode ? () => openCreateModal(stage.id) : undefined}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <TaskCard
              task={activeTask}
              type={types.find((t) => t.id === activeTask.type_id)}
              adminMode={true}
              preview
            />
          )}
        </DragOverlay>
      </DndContext>

      {(editing !== null || creatingInStage !== null) && (
        <TaskEditModal
          task={editing}
          defaultStageId={creatingInStage}
          stages={stages}
          types={types}
          onClose={closeModal}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}

      {showStageManager && (
        <StageManager
          stages={stages}
          onChange={setStages}
          onClose={() => setShowStageManager(false)}
        />
      )}

      {showTypeManager && (
        <TypeManager
          types={types}
          onChange={setTypes}
          onClose={() => setShowTypeManager(false)}
        />
      )}
    </>
  );
}
