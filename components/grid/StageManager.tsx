'use client';

// StageManager — admin modal for renaming, recoloring, reordering, adding,
// and deleting kanban stages (columns). Auto-saves on blur. Reorder by
// position number swap (up/down arrows). Deleting a stage leaves its tasks
// with stage_id = null (orphaned) per the schema's "on delete set null".

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { GridStage } from '../../lib/supabase';

interface Props {
  stages: GridStage[];
  onClose: () => void;
  onChange: (stages: GridStage[]) => void;
}

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const CYAN_FAINT = 'rgba(0,240,255,0.22)';
const RED = '#ff6060';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function StageManager({ stages: initial, onClose, onChange }: Props) {
  const [stages, setStages] = useState<GridStage[]>([...initial].sort((a, b) => a.position - b.position));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Persist a single stage row by id
  const persistStage = async (s: GridStage) => {
    const { error } = await supabase
      .from('grid_stages')
      .update({ name: s.name, color: s.color, position: s.position })
      .eq('id', s.id);
    if (error) alert('Save failed: ' + error.message);
  };

  const updateLocal = (id: string, patch: Partial<GridStage>) => {
    setStages((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...patch } : s));
      onChange(next);
      return next;
    });
  };

  const handleBlur = (id: string) => {
    const s = stages.find((x) => x.id === id);
    if (s) persistStage(s);
  };

  const moveStage = async (id: string, direction: -1 | 1) => {
    const idx = stages.findIndex((s) => s.id === id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= stages.length) return;
    const a = stages[idx];
    const b = stages[swapIdx];
    // Swap positions
    const newA = { ...a, position: b.position };
    const newB = { ...b, position: a.position };
    const next = [...stages];
    next[idx] = newB;
    next[swapIdx] = newA;
    next.sort((x, y) => x.position - y.position);
    setStages(next);
    onChange(next);
    await Promise.all([persistStage(newA), persistStage(newB)]);
  };

  const addStage = async () => {
    const maxPos = stages.reduce((m, s) => Math.max(m, s.position), 0);
    const { data, error } = await supabase
      .from('grid_stages')
      .insert({ name: 'New stage', color: '#9999ff', position: maxPos + 1 })
      .select()
      .single();
    if (error) {
      alert('Add failed: ' + error.message);
      return;
    }
    const next = [...stages, data as GridStage];
    setStages(next);
    onChange(next);
  };

  const deleteStage = async (id: string) => {
    if (!confirm('Delete this stage? Tasks in it will be orphaned (stage = none).')) return;
    const { error } = await supabase.from('grid_stages').delete().eq('id', id);
    if (error) {
      alert('Delete failed: ' + error.message);
      return;
    }
    const next = stages.filter((s) => s.id !== id);
    setStages(next);
    onChange(next);
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: CYAN_DIM,
    fontFamily: MONO,
    fontWeight: 700,
    marginBottom: 5,
    display: 'block',
  };
  const inputStyle: React.CSSProperties = {
    background: 'rgba(0,12,16,0.7)',
    border: `1px solid ${CYAN_FAINT}`,
    color: '#e0f4f8',
    padding: '8px 10px',
    fontFamily: MONO,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#020608',
          border: `1px solid ${CYAN_FAINT}`,
          boxShadow: `0 0 36px rgba(0,240,255,0.15)`,
          width: '100%',
          maxWidth: 620,
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
          clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)',
          padding: '24px 28px',
          color: '#e0f4f8',
          fontFamily: MONO,
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.36em',
            color: CYAN_DIM,
            textTransform: 'uppercase',
            marginBottom: 18,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Manage Stages</span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: CYAN_DIM, fontSize: 18, cursor: 'pointer', padding: 0, fontFamily: MONO }}
          >
            ✕
          </button>
        </div>

        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px 80px 30px',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div style={labelStyle}>Name</div>
          <div style={labelStyle}>Color</div>
          <div style={labelStyle}>Order</div>
          <div></div>
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {stages.map((s, i) => (
            <div
              key={s.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 80px 30px',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                value={s.name}
                onChange={(e) => updateLocal(s.id, { name: e.target.value })}
                onBlur={() => handleBlur(s.id)}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="color"
                  value={s.color}
                  onChange={(e) => updateLocal(s.id, { color: e.target.value })}
                  onBlur={() => handleBlur(s.id)}
                  style={{ width: 28, height: 28, border: 'none', padding: 0, background: 'transparent', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={s.color}
                  onChange={(e) => updateLocal(s.id, { color: e.target.value })}
                  onBlur={() => handleBlur(s.id)}
                  style={{ ...inputStyle, width: 66, fontSize: 11 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                <button
                  type="button"
                  onClick={() => moveStage(s.id, -1)}
                  disabled={i === 0}
                  title="Move left"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: `1px solid ${CYAN_FAINT}`,
                    color: i === 0 ? 'rgba(0,240,255,0.2)' : CYAN_DIM,
                    cursor: i === 0 ? 'default' : 'pointer',
                    fontFamily: MONO,
                    fontSize: 13,
                    padding: '6px 0',
                  }}
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => moveStage(s.id, 1)}
                  disabled={i === stages.length - 1}
                  title="Move right"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: `1px solid ${CYAN_FAINT}`,
                    color: i === stages.length - 1 ? 'rgba(0,240,255,0.2)' : CYAN_DIM,
                    cursor: i === stages.length - 1 ? 'default' : 'pointer',
                    fontFamily: MONO,
                    fontSize: 13,
                    padding: '6px 0',
                  }}
                >
                  →
                </button>
              </div>
              <button
                type="button"
                onClick={() => deleteStage(s.id)}
                title="Delete"
                style={{
                  background: 'transparent',
                  border: `1px solid ${RED}55`,
                  color: RED,
                  padding: '6px 0',
                  cursor: 'pointer',
                  fontFamily: MONO,
                  fontSize: 12,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addStage}
          style={{
            width: '100%',
            background: 'transparent',
            border: `1px dashed ${CYAN_FAINT}`,
            color: CYAN_DIM,
            padding: '10px',
            cursor: 'pointer',
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          + Add stage
        </button>

        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: `1px solid ${CYAN_FAINT}`,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: CYAN,
              border: `1px solid ${CYAN}`,
              color: '#000',
              padding: '8px 18px',
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: `0 0 12px rgba(0,240,255,0.6)`,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
