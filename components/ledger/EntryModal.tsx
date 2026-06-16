'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type {
  BudgetCategory,
  BudgetKind,
  BudgetPayer,
  GridTask,
} from '../../lib/supabase';

interface Props {
  categories: BudgetCategory[];
  payers: BudgetPayer[];
  tasks: GridTask[];
  defaultDate: Date;
  onClose: () => void;
  onSaved: () => void;
}

const PAPER = '#f5ecd3';
const INK = '#1f3422';
const INK_DIM = '#5b6e5b';
const FOREST = '#3a5a3a';
const IVY = '#6b8e4e';
const CRIMSON = '#8a2a2a';
const BRASS = '#b8932e';
const SERIF = '"Cardo", "IM Fell DW Pica", Georgia, serif';
const HAND = '"IM Fell DW Pica", "Cardo", Georgia, serif';

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const KINDS: { value: BudgetKind; label: string }[] = [
  { value: 'expense',  label: 'Expense' },
  { value: 'income',   label: 'Income' },
  { value: 'savings',  label: 'Savings' },
  { value: 'transfer', label: 'Transfer' },
];

export default function EntryModal({
  categories,
  payers,
  tasks,
  defaultDate,
  onClose,
  onSaved,
}: Props) {
  const [kind, setKind] = useState<BudgetKind>('expense');
  const [occurredOn, setOccurredOn] = useState(isoDate(defaultDate));
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [payerId, setPayerId] = useState<string>('');
  const [gridTaskId, setGridTaskId] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.kind === kind),
    [categories, kind]
  );

  // Derived effective category — keeps the user's pick if it still fits the kind,
  // otherwise falls through to the first valid option. Pure derivation, no effect.
  const effectiveCategoryId = useMemo(() => {
    if (categoryId && visibleCategories.some((c) => c.id === categoryId)) {
      return categoryId;
    }
    return visibleCategories[0]?.id ?? '';
  }, [categoryId, visibleCategories]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const amt = Number(amount);
    if (!amt || Number.isNaN(amt) || amt <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (!description.trim()) {
      setError('A short description, so the page reads clearly.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from('budget_transactions').insert({
      occurred_on: occurredOn,
      amount: amt,
      kind,
      description: description.trim(),
      note: note.trim() || null,
      category_id: effectiveCategoryId || null,
      payer_id: payerId || null,
      grid_task_id: kind === 'savings' ? (gridTaskId || null) : null,
    });
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    onSaved();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,10,5,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={save}
        style={{
          background: PAPER,
          color: INK,
          fontFamily: SERIF,
          width: 'min(520px, 100%)',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          padding: '24px 28px 22px',
          border: `1px solid ${BRASS}`,
          boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 60px ${IVY}33`,
          backgroundImage:
            `radial-gradient(circle at 20% 10%, ${IVY}1a 0%, transparent 60%), repeating-linear-gradient(0deg, transparent 0 27px, ${INK}10 27px 28px)`,
        }}
      >
        <div
          style={{
            fontVariant: 'small-caps',
            fontStyle: 'italic',
            fontSize: 22,
            letterSpacing: '0.06em',
            borderBottom: `1px double ${INK}55`,
            paddingBottom: 6,
            marginBottom: 16,
            color: FOREST,
          }}
        >
          A New Entry
        </div>

        <Label>Kind</Label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              style={{
                padding: '8px 14px',
                background: kind === k.value ? FOREST : 'transparent',
                color: kind === k.value ? PAPER : INK,
                border: `1px solid ${INK}88`,
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontSize: 13,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              {k.label}
            </button>
          ))}
        </div>

        <Row>
          <Field label="Date">
            <input
              type="date"
              required
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Amount">
            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </Row>

        <Field label="Description">
          <input
            type="text"
            required
            placeholder="e.g. seedlings from the market"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Row>
          <Field label="Category">
            <select
              value={effectiveCategoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={inputStyle}
            >
              <option value="">·</option>
              {visibleCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Payer">
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              style={inputStyle}
            >
              <option value="">·</option>
              {payers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        </Row>

        {kind === 'savings' && (
          <Field label="For a project (savings goal)">
            <select
              value={gridTaskId}
              onChange={(e) => setGridTaskId(e.target.value)}
              style={inputStyle}
            >
              <option value="">— pool savings (no specific goal) —</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.cost ? `$${Number(t.cost).toFixed(2)}` : 'no target'})
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Note (optional)">
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Field>

        {error && (
          <div
            style={{
              color: CRIMSON,
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontSize: 13,
              marginBottom: 10,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              color: INK,
              border: `1px solid ${INK}88`,
              padding: '10px 16px',
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontSize: 13,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            style={{
              background: FOREST,
              color: PAPER,
              border: `1px solid ${IVY}`,
              padding: '10px 22px',
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontSize: 14,
              letterSpacing: '0.04em',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1,
              minHeight: 44,
            }}
          >
            {busy ? 'Saving…' : 'Record it'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: SERIF,
        fontStyle: 'italic',
        fontSize: 12,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: INK_DIM,
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12, flex: 1, minWidth: 0 }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{children}</div>;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,250,235,0.7)',
  border: `1px solid ${INK}55`,
  color: INK,
  padding: '10px 12px',
  fontFamily: HAND,
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
  minHeight: 44,
};
