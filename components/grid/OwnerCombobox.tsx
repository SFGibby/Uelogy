'use client';

// Searchable owner combobox.
// Click trigger → autofocuses input. Type to filter. Up/Down navigates
// suggestions. Enter picks the highlighted match, or creates a new owner
// if nothing matches exactly. Esc closes.

import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { GridType } from '../../lib/supabase';

interface Props {
  owners: GridType[];
  selectedId: string | null;
  onPick: (id: string | null) => void;
  onOwnerCreated?: (owner: GridType) => void;
  variant?: 'default' | 'blocker';
  triggerLabel?: string; // fallback if no selected owner
  clearLabel?: string;   // label for the "clear" row (default: Unassigned)
  chipColor?: string;    // override the trigger chip color (e.g., lane color)
}

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const CYAN_FAINT = 'rgba(0,240,255,0.22)';
const BLOCKER_RED = '#ff2040';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function OwnerCombobox({
  owners,
  selectedId,
  onPick,
  onOwnerCreated,
  variant = 'default',
  triggerLabel = '+ Owner',
  clearLabel = 'Unassigned',
  chipColor,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const owner = selectedId ? owners.find((o) => o.id === selectedId) : null;

  const idle = variant === 'blocker'
    ? { color: `${BLOCKER_RED}bb`, border: `${BLOCKER_RED}66` }
    : { color: CYAN_DIM, border: CYAN_FAINT };
  const active = owner
    ? { color: chipColor ?? owner.color, border: `${chipColor ?? owner.color}66` }
    : idle;

  const filtered = query.trim()
    ? owners.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : owners;
  const exactMatch = filtered.find((o) => o.name.toLowerCase() === query.trim().toLowerCase());

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
      setQuery('');
      setHighlight(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const commitCreate = async () => {
    const name = query.trim();
    if (!name || creating) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('grid_types')
      .insert({ name, color: '#9999ff' })
      .select()
      .single();
    setCreating(false);
    if (error) {
      alert('Owner add failed: ' + error.message);
      return;
    }
    const created = data as GridType;
    onOwnerCreated?.(created);
    onPick(created.id);
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filtered[highlight];
      if (target) {
        onPick(target.id);
        setOpen(false);
      } else if (query.trim()) {
        commitCreate();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', alignSelf: 'flex-start' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          fontSize: 9,
          fontFamily: MONO,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          background: 'transparent',
          border: `1px solid ${active.border}`,
          color: active.color,
          padding: '3px 7px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {owner ? (variant === 'blocker' ? `Waiting on ${owner.name}` : owner.name) : triggerLabel}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            zIndex: 40,
            background: '#020608',
            border: `1px solid ${CYAN_FAINT}`,
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 220,
            maxHeight: 280,
            overflowY: 'auto',
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
            placeholder="Search or type to create…"
            style={{
              padding: '6px 8px',
              background: 'rgba(0,12,16,0.7)',
              border: `1px solid ${CYAN_FAINT}`,
              color: '#e0f4f8',
              fontFamily: 'inherit',
              fontSize: 12,
              outline: 'none',
              marginBottom: 4,
            }}
          />
          <button
            type="button"
            onClick={() => {
              onPick(null);
              setOpen(false);
            }}
            style={optionStyle(!owner, CYAN_DIM, false)}
          >
            {clearLabel}
          </button>
          {filtered.map((o, i) => (
            <button
              key={o.id}
              type="button"
              onMouseEnter={() => setHighlight(i)}
              onClick={() => {
                onPick(o.id);
                setOpen(false);
              }}
              style={optionStyle(owner?.id === o.id, o.color, highlight === i)}
            >
              {o.name}
            </button>
          ))}
          {query.trim() && !exactMatch && (
            <button
              type="button"
              onClick={commitCreate}
              disabled={creating}
              style={{
                ...optionStyle(false, CYAN, false),
                borderTop: `1px solid ${CYAN_FAINT}`,
                color: CYAN,
                marginTop: 2,
                fontStyle: 'italic',
              }}
            >
              {creating ? 'Creating…' : `+ Create "${query.trim()}"  ⏎`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function optionStyle(active: boolean, color: string, highlighted: boolean): React.CSSProperties {
  return {
    padding: '5px 8px',
    background: highlighted ? `${color}22` : active ? `${color}18` : 'transparent',
    border: `1px solid ${active || highlighted ? color : 'transparent'}`,
    color: active || highlighted ? color : '#cfe9f0',
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: '0.10em',
    textAlign: 'left',
    cursor: 'pointer',
  };
}
