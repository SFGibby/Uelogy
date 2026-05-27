'use client';

// TypeManager — admin modal for the tag taxonomy. Same shape as StageManager
// but no positions / no reorder. Auto-saves on blur. Deleting a type leaves
// its tasks with type_id = null (untagged) per "on delete set null".

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { GridType } from '../../lib/supabase';

interface Props {
  types: GridType[];
  onClose: () => void;
  onChange: (types: GridType[]) => void;
}

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const CYAN_FAINT = 'rgba(0,240,255,0.22)';
const RED = '#ff6060';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function TypeManager({ types: initial, onClose, onChange }: Props) {
  const [types, setTypes] = useState<GridType[]>(initial);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const persistType = async (t: GridType) => {
    const { error } = await supabase
      .from('grid_types')
      .update({ name: t.name, color: t.color })
      .eq('id', t.id);
    if (error) alert('Save failed: ' + error.message);
  };

  const updateLocal = (id: string, patch: Partial<GridType>) => {
    setTypes((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...patch } : t));
      onChange(next);
      return next;
    });
  };

  const handleBlur = (id: string) => {
    const t = types.find((x) => x.id === id);
    if (t) persistType(t);
  };

  const addType = async () => {
    const { data, error } = await supabase
      .from('grid_types')
      .insert({ name: 'New type', color: '#9999ff' })
      .select()
      .single();
    if (error) {
      alert('Add failed: ' + error.message);
      return;
    }
    const next = [...types, data as GridType];
    setTypes(next);
    onChange(next);
  };

  const deleteType = async (id: string) => {
    if (!confirm('Delete this type? Tasks using it will become untagged.')) return;
    const { error } = await supabase.from('grid_types').delete().eq('id', id);
    if (error) {
      alert('Delete failed: ' + error.message);
      return;
    }
    const next = types.filter((t) => t.id !== id);
    setTypes(next);
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
          maxWidth: 540,
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
          <span>Manage Types</span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: CYAN_DIM, fontSize: 18, cursor: 'pointer', padding: 0, fontFamily: MONO }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 30px', gap: 8, marginBottom: 8 }}>
          <div style={labelStyle}>Name</div>
          <div style={labelStyle}>Color</div>
          <div></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {types.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 30px',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                value={t.name}
                onChange={(e) => updateLocal(t.id, { name: e.target.value })}
                onBlur={() => handleBlur(t.id)}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="color"
                  value={t.color}
                  onChange={(e) => updateLocal(t.id, { color: e.target.value })}
                  onBlur={() => handleBlur(t.id)}
                  style={{ width: 28, height: 28, border: 'none', padding: 0, background: 'transparent', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={t.color}
                  onChange={(e) => updateLocal(t.id, { color: e.target.value })}
                  onBlur={() => handleBlur(t.id)}
                  style={{ ...inputStyle, width: 82, fontSize: 11 }}
                />
              </div>
              <button
                type="button"
                onClick={() => deleteType(t.id)}
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
          onClick={addType}
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
          + Add type
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
