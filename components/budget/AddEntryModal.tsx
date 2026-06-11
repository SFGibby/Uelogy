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

const PAPER = '#f1e3c0';
const INK = '#2a1b10';
const INK_DIM = '#6b5640';
const LAMP = '#f0a040';
const RED_INK = '#a8301f';
const SERIF = 'Georgia, "Iowan Old Style", serif';
const HAND = '"Courier Prime", "Courier New", ui-monospace, monospace';

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

export default function AddEntryModal({
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

  // Categories filtered to the chosen kind
  const visibleCategories = useMemo(
    () => categories.filter((c) => c.kind === kind),
    [categories, kind]
  );

  // Reset category when kind changes if current pick no longer fits
  useEffect(() => {
    if (categoryId && !visibleCategories.find((c) => c.id === categoryId)) {
      setCategoryId(visibleCategories[0]?.id ?? '');
    } else if (!categoryId && visibleCategories[0]) {
      setCategoryId(visibleCategories[0].id);
    }
  }, [visibleCategories, categoryId]);

  // Close on Escape
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
      setError('Add a short description so it reads in the ledger.');
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
      category_id: categoryId || null,
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
        background: 'rgba(0,0,0,0.6)',
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
          width: 'min(500px, 100%)',
          padding: '24px 28px 22px',
          border: '1px solid #8a6a3a',
          boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 60px ${LAMP}44`,
        }}
      >
        <div
          style={{
            fontVariant: 'small-caps',
            fontSize: 22,
            letterSpacing: '0.04em',
            borderBottom: `1px solid ${INK}55`,
            paddingBottom: 6,
            marginBottom: 16,
          }}
        >
          New Entry
        </div>

        <Label>Kind</Label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              style={{
                padding: '6px 12px',
                background: kind === k.value ? INK : 'transparent',
                color: kind === k.value ? PAPER : INK,
                border: `1px solid ${INK}88`,
                fontFamily: HAND,
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: 'pointer',
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
            placeholder="e.g. Costco run"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Row>
          <Field label="Category">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={inputStyle}
            >
              <option value="">—</option>
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
              <option value="">—</option>
              {payers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        </Row>

        {kind === 'savings' && (
          <Field label="For project (savings goal)">
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
              color: RED_INK,
              fontFamily: HAND,
              fontSize: 12,
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
              padding: '8px 14px',
              fontFamily: HAND,
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            style={{
              background: LAMP,
              color: '#2a1300',
              border: 'none',
              padding: '8px 18px',
              fontFamily: HAND,
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 800,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1,
              boxShadow: `0 0 12px ${LAMP}aa`,
            }}
          >
            {busy ? 'Saving…' : 'Record Entry'}
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
        fontFamily: HAND,
        fontSize: 10,
        letterSpacing: '0.3em',
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
    <div style={{ marginBottom: 12, flex: 1 }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 12 }}>{children}</div>;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,250,235,0.7)',
  border: `1px solid ${INK}55`,
  color: INK,
  padding: '8px 10px',
  fontFamily: HAND,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};
