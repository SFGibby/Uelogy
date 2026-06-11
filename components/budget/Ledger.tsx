'use client';

// The Ledger — budget tool. Lives at /grid/budget, behind Flynn's gate.
// Aesthetic: warm leather book on a desk under a brass lamp.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import type {
  BudgetCategory,
  BudgetPayer,
  BudgetRecurring,
  BudgetTransaction,
  GridTask,
  GridTaskSavings,
} from '../../lib/supabase';
import AddEntryModal from './AddEntryModal';

const PAPER = '#f1e3c0';
const PAPER_EDGE = '#c9b288';
const INK = '#2a1b10';
const INK_DIM = '#6b5640';
const RED_INK = '#a8301f';
const GREEN_INK = '#2e6a3c';
const LAMP = '#f0a040';
const WOOD = '#3a2010';
const SERIF = 'Georgia, "Iowan Old Style", "Times New Roman", serif';
const HAND = '"Courier Prime", "Courier New", ui-monospace, monospace';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Ledger() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [payers, setPayers] = useState<BudgetPayer[]>([]);
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [recurring, setRecurring] = useState<BudgetRecurring[]>([]);
  const [tasks, setTasks] = useState<GridTask[]>([]);
  const [savings, setSavings] = useState<GridTaskSavings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const start = isoDate(startOfMonth(month));
    const end = isoDate(endOfMonth(month));

    const [c, p, tx, r, t, s] = await Promise.all([
      supabase.from('budget_categories').select('*').eq('is_active', true).order('name'),
      supabase.from('budget_payers').select('*').order('name'),
      supabase
        .from('budget_transactions')
        .select('*')
        .gte('occurred_on', start)
        .lte('occurred_on', end)
        .order('occurred_on', { ascending: false }),
      supabase.from('budget_recurring').select('*').eq('is_active', true).order('next_due_date'),
      supabase.from('grid_tasks').select('*').not('cost', 'is', null),
      supabase.from('grid_task_savings').select('*'),
    ]);

    const firstErr =
      c.error?.message ?? p.error?.message ?? tx.error?.message ??
      r.error?.message ?? t.error?.message ?? s.error?.message;
    if (firstErr) setError(firstErr);

    setCategories((c.data as BudgetCategory[]) ?? []);
    setPayers((p.data as BudgetPayer[]) ?? []);
    setTransactions((tx.data as BudgetTransaction[]) ?? []);
    setRecurring((r.data as BudgetRecurring[]) ?? []);
    setTasks((t.data as GridTask[]) ?? []);
    setSavings((s.data as GridTaskSavings[]) ?? []);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );
  const payerById = useMemo(
    () => new Map(payers.map((p) => [p.id, p])),
    [payers]
  );
  const savingsByTaskId = useMemo(
    () => new Map(savings.map((s) => [s.grid_task_id, s])),
    [savings]
  );

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let saved = 0;
    for (const t of transactions) {
      if (t.kind === 'income') income += Number(t.amount);
      else if (t.kind === 'expense') expense += Number(t.amount);
      else if (t.kind === 'savings') saved += Number(t.amount);
    }
    return { income, expense, saved, net: income - expense - saved };
  }, [transactions]);

  // Recurring items whose next_due_date falls within this month
  const dueThisMonth = useMemo(() => {
    const start = startOfMonth(month).getTime();
    const end = endOfMonth(month).getTime();
    return recurring.filter((r) => {
      if (!r.next_due_date) return false;
      const t = new Date(r.next_due_date).getTime();
      return t >= start && t <= end;
    });
  }, [recurring, month]);

  function shiftMonth(delta: number) {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          `radial-gradient(60% 50% at 50% 0%, ${LAMP}33 0%, transparent 60%), linear-gradient(180deg, ${WOOD} 0%, #1a0e06 100%)`,
        backgroundAttachment: 'fixed',
        fontFamily: SERIF,
        color: INK,
        padding: '40px 16px 80px',
      }}
    >
      {/* lamp halo top */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: -120,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${LAMP}66 0%, transparent 65%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Top bar */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 880,
          margin: '0 auto 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#e8c98a',
          fontFamily: SERIF,
        }}
      >
        <Link
          href="/grid"
          style={{
            color: '#e8c98a',
            fontFamily: HAND,
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            border: '1px solid #8a6a3a',
            padding: '6px 12px',
          }}
        >
          ← Back to Flynn&apos;s
        </Link>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontSize: 22,
          }}
        >
          <button
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            style={navBtnStyle}
          >
            ◀
          </button>
          <span style={{ minWidth: 200, textAlign: 'center' }}>
            {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
          </span>
          <button
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            style={navBtnStyle}
          >
            ▶
          </button>
        </div>
        <button
          onClick={() => setAdding(true)}
          style={{
            background: LAMP,
            color: '#2a1300',
            border: 'none',
            padding: '8px 18px',
            fontFamily: HAND,
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 0 12px ${LAMP}aa`,
          }}
        >
          + Add Entry
        </button>
      </div>

      {/* The book */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 880,
          margin: '0 auto',
          background: PAPER,
          backgroundImage:
            `radial-gradient(circle at 30% 20%, ${PAPER_EDGE}22 0%, transparent 60%), repeating-linear-gradient(0deg, transparent 0 27px, ${PAPER_EDGE}22 27px 28px)`,
          border: `1px solid ${PAPER_EDGE}`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 0 60px rgba(120,80,30,0.15)',
          padding: '36px clamp(20px, 5vw, 56px) 44px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontVariant: 'small-caps',
            letterSpacing: '0.06em',
            fontSize: 'clamp(28px, 4vw, 40px)',
            color: INK,
            borderBottom: `1px solid ${INK}`,
            paddingBottom: 8,
            marginBottom: 24,
          }}
        >
          The Household Ledger
        </h1>

        {error && (
          <div
            style={{
              background: '#f9d6c8',
              border: `1px solid ${RED_INK}`,
              color: RED_INK,
              padding: '10px 14px',
              marginBottom: 16,
              fontFamily: HAND,
              fontSize: 13,
            }}
          >
            Something went wrong: {error}. Did you run the budget-schema.sql migration?
          </div>
        )}

        {/* Summary */}
        <Summary {...totals} />

        {/* Recurring due this month */}
        <Section title="Recurring This Month">
          {dueThisMonth.length === 0 ? (
            <Empty hint="Nothing scheduled for this month." />
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Due</th>
                  <th style={thStyle}>Item</th>
                  <th style={thStyle}>Payer</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {dueThisMonth.map((r) => (
                  <tr key={r.id}>
                    <td style={tdStyle}>
                      {r.next_due_date
                        ? new Date(r.next_due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td style={tdStyle}>{r.name}</td>
                    <td style={{ ...tdStyle, color: INK_DIM }}>
                      {r.payer_id ? payerById.get(r.payer_id)?.name ?? '—' : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: RED_INK }}>
                      {fmt(Number(r.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Transactions */}
        <Section title="Entries">
          {loading ? (
            <Empty hint="Opening the book…" />
          ) : transactions.length === 0 ? (
            <Empty hint="No entries this month. Add one to start the ledger." />
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Payer</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const cat = t.category_id ? catById.get(t.category_id) : undefined;
                  const color =
                    t.kind === 'income'
                      ? GREEN_INK
                      : t.kind === 'savings'
                      ? GREEN_INK
                      : RED_INK;
                  const sign = t.kind === 'income' ? '+' : t.kind === 'savings' ? '↗' : '−';
                  return (
                    <tr key={t.id}>
                      <td style={tdStyle}>
                        {new Date(t.occurred_on).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td style={tdStyle}>{t.description}</td>
                      <td style={{ ...tdStyle, color: cat?.color ?? INK_DIM }}>
                        {cat?.name ?? '—'}
                      </td>
                      <td style={{ ...tdStyle, color: INK_DIM }}>
                        {t.payer_id ? payerById.get(t.payer_id)?.name ?? '—' : '—'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', color, fontFamily: HAND }}>
                        {sign} {fmt(Number(t.amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Section>

        {/* Savings Goals (Grid↔Budget link) */}
        <Section title="Savings Goals">
          {tasks.length === 0 ? (
            <Empty hint="Mark a project on The Grid with a cost to start saving toward it." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tasks.map((task) => {
                const sg = savingsByTaskId.get(task.id);
                const target = Number(task.cost ?? 0);
                const saved = Number(sg?.saved ?? 0);
                const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
                return (
                  <div key={task.id}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{task.title}</span>
                      <span style={{ fontFamily: HAND, fontSize: 13, color: INK_DIM }}>
                        {fmt(saved)} / {fmt(target)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 10,
                        background: `${INK}22`,
                        border: `1px solid ${INK}55`,
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: `${pct}%`,
                          background: GREEN_INK,
                          boxShadow: `inset 0 0 4px ${INK}44`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {adding && (
        <AddEntryModal
          categories={categories}
          payers={payers}
          tasks={tasks}
          defaultDate={new Date()}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}
    </main>
  );
}

function Summary({ income, expense, saved, net }: { income: number; expense: number; saved: number; net: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginBottom: 24,
        padding: '14px 0',
        borderTop: `1px solid ${INK}55`,
        borderBottom: `1px solid ${INK}55`,
      }}
    >
      <Stat label="Income" value={income} color={GREEN_INK} />
      <Stat label="Expense" value={expense} color={RED_INK} />
      <Stat label="Savings" value={saved} color={GREEN_INK} />
      <Stat label="Net" value={net} color={net >= 0 ? GREEN_INK : RED_INK} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: INK_DIM, fontFamily: HAND, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: HAND, fontSize: 22, color }}>{fmt(value)}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2
        style={{
          fontFamily: SERIF,
          fontVariant: 'small-caps',
          fontSize: 18,
          letterSpacing: '0.06em',
          margin: '0 0 10px',
          color: INK,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Empty({ hint }: { hint: string }) {
  return (
    <div
      style={{
        fontFamily: SERIF,
        fontStyle: 'italic',
        color: INK_DIM,
        padding: '14px 4px',
        borderTop: `1px dashed ${INK}44`,
      }}
    >
      {hint}
    </div>
  );
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: HAND,
  fontSize: 14,
};
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontFamily: SERIF,
  fontVariant: 'small-caps',
  fontSize: 12,
  letterSpacing: '0.1em',
  color: INK_DIM,
  borderBottom: `1px solid ${INK}55`,
  padding: '6px 8px',
};
const tdStyle: React.CSSProperties = {
  padding: '8px 8px',
  borderBottom: `1px dashed ${INK}33`,
  verticalAlign: 'top',
  color: INK,
};
const navBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #8a6a3a',
  color: '#e8c98a',
  padding: '4px 10px',
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: SERIF,
};
