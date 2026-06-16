'use client';

// The Ledger — Antha's budget tool. Lives at /ledger, behind its own password.
// Aesthetic: illuminated manuscript on parchment, vine borders, brass key, secret-garden palette.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type {
  BudgetCategory,
  BudgetPayer,
  BudgetRecurring,
  BudgetTransaction,
  GridTask,
  GridTaskSavings,
} from '../../lib/supabase';
import EntryModal from './EntryModal';
import ReturnHome from '../site/ReturnHome';

const PAPER = '#f5ecd3';
const PAPER_EDGE = '#c9b485';
const INK = '#1f3422';
const INK_DIM = '#5b6e5b';
const CRIMSON = '#8a2a2a';
const FOREST = '#3a5a3a';
const IVY = '#6b8e4e';
const TEAL_DIM = '#3a5a6b';
const BRASS = '#b8932e';
const WOOD = '#2a1810';
const SERIF = '"Cardo", "IM Fell DW Pica", Georgia, "Iowan Old Style", serif';
const HAND = '"IM Fell DW Pica", "Cardo", Georgia, serif';

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

export default function TheLedger() {
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

  const monthName = MONTH_NAMES[month.getMonth()];
  const dropCap = monthName.charAt(0);
  const monthRest = monthName.slice(1);

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          `radial-gradient(80% 60% at 50% 0%, ${IVY}26 0%, transparent 60%), linear-gradient(180deg, ${WOOD} 0%, #120a06 100%)`,
        backgroundAttachment: 'fixed',
        fontFamily: SERIF,
        color: INK,
        padding: '40px 16px 80px',
      }}
    >
      <ReturnHome variant="garden-gate" />

      {/* Top bar (month nav + add entry) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 880,
          margin: '0 auto 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          color: '#e7d6a8',
          fontFamily: SERIF,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontSize: 22,
          }}
        >
          <button onClick={() => shiftMonth(-1)} aria-label="Previous month" style={navBtnStyle}>
            ◀
          </button>
          <span style={{ minWidth: 180, textAlign: 'center' }}>
            {monthName} {month.getFullYear()}
          </span>
          <button onClick={() => shiftMonth(1)} aria-label="Next month" style={navBtnStyle}>
            ▶
          </button>
        </div>
        <button
          onClick={() => setAdding(true)}
          style={{
            background: FOREST,
            color: PAPER,
            border: `1px solid ${IVY}`,
            padding: '10px 22px',
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontSize: 14,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            boxShadow: `0 4px 14px rgba(0,0,0,0.4)`,
            minHeight: 44,
          }}
        >
          ✦ Record an Entry
        </button>
      </div>

      {/* The illuminated page */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 880,
          margin: '0 auto',
          background: PAPER,
          backgroundImage:
            `radial-gradient(circle at 20% 10%, ${PAPER_EDGE}28 0%, transparent 60%), radial-gradient(circle at 80% 90%, ${PAPER_EDGE}22 0%, transparent 55%), repeating-linear-gradient(0deg, transparent 0 27px, ${PAPER_EDGE}1d 27px 28px)`,
          border: `1px solid ${PAPER_EDGE}`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 0 60px rgba(75,90,40,0.15)',
          padding: '36px clamp(20px, 5vw, 56px) 48px',
        }}
      >
        <VineCorner pos="tl" />
        <VineCorner pos="tr" />
        <VineCorner pos="bl" />
        <VineCorner pos="br" />

        {/* Title with illuminated drop cap on the month */}
        <header style={{ marginBottom: 28, borderBottom: `1px double ${INK}`, paddingBottom: 14 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontVariant: 'small-caps',
              letterSpacing: '0.08em',
              fontSize: 'clamp(28px, 4vw, 40px)',
              color: INK,
              fontStyle: 'italic',
            }}
          >
            The Household Ledger
          </h1>
          <div
            style={{
              marginTop: 6,
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontSize: 18,
              color: INK_DIM,
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
            }}
          >
            <span
              aria-hidden
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: 44,
                color: BRASS,
                lineHeight: 1,
                marginRight: 4,
                textShadow: `0 1px 0 ${INK}22`,
              }}
            >
              {dropCap}
            </span>
            <span>
              {monthRest}, in the year of our Lord {month.getFullYear()}
            </span>
          </div>
        </header>

        {error && (
          <div
            style={{
              background: '#f3d6cc',
              border: `1px solid ${CRIMSON}`,
              color: CRIMSON,
              padding: '10px 14px',
              marginBottom: 16,
              fontFamily: HAND,
              fontSize: 13,
            }}
          >
            A complication: {error}. Has the budget-schema.sql migration been run?
          </div>
        )}

        <Summary {...totals} />

        <Section title="Recurring this month">
          {dueThisMonth.length === 0 ? (
            <Empty hint="Nothing scheduled to come due." />
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
                        : '·'}
                    </td>
                    <td style={tdStyle}>{r.name}</td>
                    <td style={{ ...tdStyle, color: INK_DIM, fontStyle: 'italic' }}>
                      {r.payer_id ? payerById.get(r.payer_id)?.name ?? '·' : '·'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: CRIMSON }}>
                      {fmt(Number(r.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <PressedLeafDivider />

        <Section title="The day's entries">
          {loading ? (
            <Empty hint="Turning the page…" />
          ) : transactions.length === 0 ? (
            <Empty hint="The page is yet unwritten. Record an entry above." />
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
                    t.kind === 'income' || t.kind === 'savings' ? FOREST : CRIMSON;
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
                      <td style={{ ...tdStyle, color: cat?.color ?? INK_DIM, fontStyle: 'italic' }}>
                        {cat?.name ?? '·'}
                      </td>
                      <td style={{ ...tdStyle, color: INK_DIM, fontStyle: 'italic' }}>
                        {t.payer_id ? payerById.get(t.payer_id)?.name ?? '·' : '·'}
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

        <PressedLeafDivider />

        <Section title="Things we are saving toward">
          {tasks.length === 0 ? (
            <Empty hint="Mark a project on The Grid with a cost to plant a savings goal here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                        marginBottom: 6,
                        flexWrap: 'wrap',
                        gap: 6,
                      }}
                    >
                      <span style={{ fontWeight: 600, fontFamily: SERIF }}>{task.title}</span>
                      <span style={{ fontFamily: HAND, fontSize: 14, color: INK_DIM }}>
                        {fmt(saved)} / {fmt(target)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        background: `${INK}1c`,
                        border: `1px solid ${INK}55`,
                        position: 'relative',
                        borderRadius: 1,
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${FOREST} 0%, ${IVY} 100%)`,
                          boxShadow: `inset 0 0 4px ${INK}33`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <footer
          style={{
            marginTop: 36,
            paddingTop: 14,
            borderTop: `1px solid ${INK}55`,
            color: TEAL_DIM,
            fontStyle: 'italic',
            fontFamily: SERIF,
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          Kept faithfully on this {new Date().toLocaleDateString('en-US', { weekday: 'long' })}.
        </footer>
      </div>

      {adding && (
        <EntryModal
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
        marginBottom: 26,
        padding: '14px 0',
        borderTop: `1px solid ${INK}55`,
        borderBottom: `1px solid ${INK}55`,
      }}
    >
      <Stat label="Income" value={income} color={FOREST} />
      <Stat label="Expense" value={expense} color={CRIMSON} />
      <Stat label="Savings" value={saved} color={FOREST} />
      <Stat label="Net" value={net} color={net >= 0 ? FOREST : CRIMSON} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: INK_DIM,
          fontFamily: SERIF,
          fontStyle: 'italic',
          marginBottom: 4,
        }}
      >
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
          fontStyle: 'italic',
          fontSize: 19,
          letterSpacing: '0.08em',
          margin: '0 0 12px',
          color: FOREST,
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

function PressedLeafDivider() {
  return (
    <div aria-hidden style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0' }}>
      <div style={{ flex: 1, height: 1, background: `${INK}44` }} />
      <svg width="24" height="14" viewBox="0 0 24 14" aria-hidden>
        <path
          d="M 2 7 Q 8 0 12 7 Q 16 14 22 7"
          stroke={IVY}
          strokeWidth="1.2"
          fill="none"
        />
        <circle cx="12" cy="7" r="1.6" fill={BRASS} />
      </svg>
      <div style={{ flex: 1, height: 1, background: `${INK}44` }} />
    </div>
  );
}

function VineCorner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const place: React.CSSProperties = {
    position: 'absolute',
    width: 48,
    height: 48,
    pointerEvents: 'none',
    opacity: 0.55,
  };
  if (pos === 'tl') Object.assign(place, { top: 6, left: 6, transform: 'rotate(0deg)' });
  if (pos === 'tr') Object.assign(place, { top: 6, right: 6, transform: 'scaleX(-1)' });
  if (pos === 'bl') Object.assign(place, { bottom: 6, left: 6, transform: 'scaleY(-1)' });
  if (pos === 'br') Object.assign(place, { bottom: 6, right: 6, transform: 'scale(-1,-1)' });
  return (
    <svg style={place} viewBox="0 0 48 48" aria-hidden>
      <path
        d="M 4 30 Q 4 14 22 8 Q 30 6 36 12 M 12 28 Q 16 22 22 22 M 18 36 Q 22 30 28 30"
        stroke={IVY}
        strokeWidth="1.2"
        fill="none"
      />
      <ellipse cx="22" cy="22" rx="4" ry="2" fill={IVY} opacity="0.5" />
      <ellipse cx="28" cy="30" rx="3.5" ry="1.8" fill={IVY} opacity="0.4" />
      <circle cx="36" cy="12" r="2" fill={BRASS} opacity="0.6" />
    </svg>
  );
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: HAND,
  fontSize: 15,
};
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontFamily: SERIF,
  fontVariant: 'small-caps',
  fontStyle: 'italic',
  fontSize: 12,
  letterSpacing: '0.12em',
  color: INK_DIM,
  borderBottom: `1px solid ${INK}55`,
  padding: '6px 8px',
};
const tdStyle: React.CSSProperties = {
  padding: '9px 8px',
  borderBottom: `1px dashed ${INK}33`,
  verticalAlign: 'top',
  color: INK,
};
const navBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${BRASS}`,
  color: '#e7d6a8',
  padding: '4px 12px',
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: SERIF,
  fontStyle: 'italic',
  minWidth: 44,
  minHeight: 36,
};
