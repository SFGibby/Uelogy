'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import ProfessorUel from './ProfessorUel';
import ScoreEntry from './games/ScoreEntry';

const PROGRESS_KEY = 'sql_learn_progress';
const SUBMIT_KEY = 'sql_learn_submitted';

interface Progress {
  activeLesson: number;
  queries: Record<string, string>;
  completed: string[];
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : { activeLesson: 0, queries: {}, completed: [] };
  } catch {
    return { activeLesson: 0, queries: {}, completed: [] };
  }
}

function saveProgress(p: Progress) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch { /* silent */ }
}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error no types for sql.js
import initSqlJs from 'sql.js';

const SETUP_SQL = `
CREATE TABLE reps (
  id INTEGER PRIMARY KEY,
  name TEXT,
  region TEXT,
  active INTEGER
);
INSERT INTO reps VALUES (1,'Sam Gibson','Utah',1);
INSERT INTO reps VALUES (2,'Jake Torres','Arizona',1);
INSERT INTO reps VALUES (3,'Mia Chen','California',1);
INSERT INTO reps VALUES (4,'Brett Hull','Nevada',0);
INSERT INTO reps VALUES (5,'Dana Park','Colorado',1);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT,
  city TEXT,
  state TEXT,
  monthly_bill REAL
);
INSERT INTO customers VALUES (1,'John Mercer','Provo','UT',210);
INSERT INTO customers VALUES (2,'Lisa Romero','Mesa','AZ',320);
INSERT INTO customers VALUES (3,'Tom Blake','Fresno','CA',280);
INSERT INTO customers VALUES (4,'Amy Nguyen','Reno','NV',190);
INSERT INTO customers VALUES (5,'Chris Ford','Denver','CO',245);
INSERT INTO customers VALUES (6,'Sarah Diaz','Tucson','AZ',310);
INSERT INTO customers VALUES (7,'Paul Kim','Salt Lake City','UT',175);
INSERT INTO customers VALUES (8,'Rachel Stone','Las Vegas','NV',410);
INSERT INTO customers VALUES (9,'Derek Hall','Bakersfield','CA',230);
INSERT INTO customers VALUES (10,'Nina Watts','Boulder','CO',265);

CREATE TABLE deals (
  id INTEGER PRIMARY KEY,
  rep_id INTEGER,
  customer_id INTEGER,
  system_kw REAL,
  sale_price REAL,
  status TEXT,
  close_date TEXT
);
INSERT INTO deals VALUES (1,1,1,8.4,28000,'installed','2024-03-12');
INSERT INTO deals VALUES (2,2,2,10.2,34000,'installed','2024-04-05');
INSERT INTO deals VALUES (3,1,7,6.0,21000,'installed','2024-04-18');
INSERT INTO deals VALUES (4,3,3,9.6,32000,'pending','2024-05-01');
INSERT INTO deals VALUES (5,4,4,7.2,24000,'cancelled','2024-02-20');
INSERT INTO deals VALUES (6,2,6,11.0,37000,'installed','2024-05-15');
INSERT INTO deals VALUES (7,5,5,8.0,27000,'installed','2024-06-01');
INSERT INTO deals VALUES (8,3,9,7.8,26000,'pending','2024-06-10');
INSERT INTO deals VALUES (9,1,7,9.0,30000,'installed','2024-07-03');
INSERT INTO deals VALUES (10,5,10,8.5,28500,'installed','2024-07-22');
INSERT INTO deals VALUES (11,2,8,12.0,40000,'installed','2024-08-01');
INSERT INTO deals VALUES (12,4,4,6.5,22000,'cancelled','2024-08-15');
`;

const LESSONS = [
  {
    id: 'intro',
    title: '00. What is SQL',
    concept: `SQL (Structured Query Language) is how you talk to databases.
A database is just a collection of tables — like spreadsheets that can talk to each other.

You have 3 tables to work with:
  reps       — your sales team
  customers  — homeowners
  deals      — solar deals (tied to reps and customers)

Every query starts with SELECT.`,
    query: `SELECT * FROM reps;`,
    hint: '* means "give me everything". Try running it.',
  },
  {
    id: 'select',
    title: '01. Select Columns',
    concept: `Instead of grabbing everything with *, you can pick specific columns.

This is useful when tables have 30 columns and you only need 3.`,
    query: `SELECT name, region FROM reps;`,
    hint: 'List the columns you want, separated by commas.',
  },
  {
    id: 'where',
    title: '02. WHERE (Filtering)',
    concept: `WHERE lets you filter rows — like a search.

Operators you can use:
  =    equals
  !=   not equals
  >    greater than
  <    less than
  >=   greater than or equal
  LIKE 'text%'  pattern match (% is wildcard)`,
    query: `SELECT name, city, state, monthly_bill
FROM customers
WHERE state = 'AZ';`,
    hint: "Try changing 'AZ' to 'UT' or 'CA'. Text values need quotes.",
  },
  {
    id: 'and_or',
    title: '03. AND / OR',
    concept: `Stack multiple conditions with AND or OR.

AND = both conditions must be true
OR  = either condition can be true`,
    query: `SELECT name, city, monthly_bill
FROM customers
WHERE state = 'AZ' AND monthly_bill > 300;`,
    hint: 'Try swapping AND for OR and see what changes.',
  },
  {
    id: 'order',
    title: '04. ORDER BY',
    concept: `ORDER BY sorts your results.

ASC  = smallest to biggest (default)
DESC = biggest to smallest`,
    query: `SELECT name, monthly_bill
FROM customers
ORDER BY monthly_bill DESC;`,
    hint: 'Change DESC to ASC to flip the order.',
  },
  {
    id: 'limit',
    title: '05. LIMIT',
    concept: `LIMIT caps how many rows come back.
Pair it with ORDER BY to get "top N" lists.`,
    query: `SELECT name, monthly_bill
FROM customers
ORDER BY monthly_bill DESC
LIMIT 3;`,
    hint: 'This gives you the top 3 highest utility bills.',
  },
  {
    id: 'aggregate',
    title: '06. COUNT, SUM, AVG',
    concept: `Aggregate functions crunch numbers across rows:

  COUNT(*)   how many rows
  SUM(col)   add them all up
  AVG(col)   average
  MAX(col)   highest value
  MIN(col)   lowest value`,
    query: `SELECT
  COUNT(*) AS total_customers,
  AVG(monthly_bill) AS avg_bill,
  MAX(monthly_bill) AS highest_bill
FROM customers;`,
    hint: 'AS gives your columns a readable name in the results.',
  },
  {
    id: 'groupby',
    title: '07. GROUP BY',
    concept: `GROUP BY splits rows into buckets and runs aggregates on each bucket.

Classic use: "show me totals broken down by category."`,
    query: `SELECT state, COUNT(*) AS customers, AVG(monthly_bill) AS avg_bill
FROM customers
GROUP BY state;`,
    hint: 'One row per state. Try grouping deals by status instead.',
  },
  {
    id: 'join',
    title: '08. JOIN',
    concept: `JOIN connects two tables on a shared column.

This is the big one. Your data lives in separate tables,
JOIN pulls them together into one result.

deals.rep_id matches reps.id
deals.customer_id matches customers.id`,
    query: `SELECT reps.name AS rep, customers.name AS customer, deals.sale_price
FROM deals
JOIN reps ON deals.rep_id = reps.id
JOIN customers ON deals.customer_id = customers.id;`,
    hint: 'You just combined 3 tables into one view.',
  },
  {
    id: 'join_filter',
    title: '09. JOIN + WHERE',
    concept: `Combine JOIN with WHERE to get specific cross-table results.

Real world: "show me all installed deals and which rep closed them."`,
    query: `SELECT reps.name AS rep, customers.name AS customer,
       deals.system_kw, deals.sale_price, deals.status
FROM deals
JOIN reps ON deals.rep_id = reps.id
JOIN customers ON deals.customer_id = customers.id
WHERE deals.status = 'installed'
ORDER BY deals.sale_price DESC;`,
    hint: "Try changing 'installed' to 'pending' or 'cancelled'.",
  },
  {
    id: 'groupby_join',
    title: '10. Rep Leaderboard',
    concept: `Put it all together: JOIN + GROUP BY + ORDER BY.

This is a real query you'd run at a solar company to see
who your top reps are by total revenue.`,
    query: `SELECT reps.name AS rep,
       COUNT(deals.id) AS total_deals,
       SUM(deals.sale_price) AS total_revenue,
       AVG(deals.system_kw) AS avg_system_size
FROM reps
JOIN deals ON reps.id = deals.rep_id
WHERE deals.status = 'installed'
GROUP BY reps.name
ORDER BY total_revenue DESC;`,
    hint: "This is the kind of query that replaces a manual spreadsheet.",
  },
];

type Row = Record<string, string | number | null>;

// Classroom palette — warm dim room, chalkboard green, wooden lockers + desk
const c = {
  bg:          '#1a1d28',   // room (dim classroom light)
  wall:        '#22252f',   // wall plaster (slightly lighter)
  sidebar:     '#3a2b1f',   // locker bank backing (dark wood)
  border:      '#4a3422',   // wood-grain border
  borderHL:    '#6b4a2c',   // brighter wood edge
  chalkboard:  '#1e3a2a',   // chalkboard green
  chalkFrame:  '#5e4b2e',   // wooden chalkboard frame
  chalk:       '#f0ebd0',   // chalk-white text
  chalkDust:   '#a8a290',   // faded chalk
  text:        '#f0ead8',   // warm white body text
  muted:       '#a89d80',   // soft tan/muted text
  accent:      '#e3b465',   // brass — for active locker, hover, accents
  accentHover: '#f0c878',
  desk:        '#7a4a2a',   // wooden desk
  deskTop:     '#a06530',   // lighter desk surface
  codeBg:      '#241612',   // textarea bg on desk (dark wood-inset)
  rowAlt:      '#202736',
  error:       '#f0846a',   // red ink
  panelBg:     '#2a3b3a',   // chalkboard-adjacent panel for results
  lessonDone:  '#7fc7a3',   // green LED on a completed locker
};

export default function SQLLearn() {
  const [db, setDb] = useState<unknown>(null);
  const [ready, setReady] = useState(false);
  const [activeLesson, setActiveLesson] = useState(0);
  const [query, setQuery] = useState(LESSONS[0].query);
  const [results, setResults] = useState<Row[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [ran, setRan] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [submittedScore, setSubmittedScore] = useState(false);
  const [showScoreEntry, setShowScoreEntry] = useState(false);
  const progressRef = useRef<Progress>({ activeLesson: 0, queries: {}, completed: [] });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSubmittedScore(typeof window !== 'undefined' && localStorage.getItem(SUBMIT_KEY) === '1');
  }, []);

  const allDone = completed.length >= LESSONS.length;

  useEffect(() => {
    const p = loadProgress();
    progressRef.current = p;
    const savedLesson = Math.min(p.activeLesson, LESSONS.length - 1);
    setActiveLesson(savedLesson);
    setCompleted(p.completed);
    const savedQuery = p.queries[LESSONS[savedLesson].id] ?? LESSONS[savedLesson].query;
    setQuery(savedQuery);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initSqlJs({ locateFile: () => '/sql-wasm.wasm' }).then((SQL: any) => {
      const database = new SQL.Database();
      database.run(SETUP_SQL);
      setDb(database);
      setReady(true);
    });
  }, []);

  const persistQuery = useCallback((lessonId: string, q: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      progressRef.current.queries[lessonId] = q;
      saveProgress(progressRef.current);
    }, 600);
  }, []);

  const runQuery = useCallback(() => {
    if (!db || !query.trim()) return;
    setError('');
    setResults([]);
    setColumns([]);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = (db as any).exec(query);
      if (res.length === 0) {
        setResults([]);
        setColumns([]);
        setRan(true);
        // Mark complete even for non-SELECT queries (e.g. INSERT)
        setCompleted(prev => {
          const id = LESSONS[activeLesson].id;
          if (prev.includes(id)) return prev;
          const next = [...prev, id];
          progressRef.current.completed = next;
          saveProgress(progressRef.current);
          return next;
        });
        return;
      }
      const { columns: cols, values } = res[0];
      setColumns(cols);
      setResults(values.map((row: unknown[]) => {
        const obj: Row = {};
        cols.forEach((col: string, i: number) => { obj[col] = row[i] as string | number | null; });
        return obj;
      }));
      setRan(true);
      // Mark lesson complete on successful run
      setCompleted(prev => {
        const id = LESSONS[activeLesson].id;
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        progressRef.current.completed = next;
        saveProgress(progressRef.current);
        return next;
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setRan(true);
    }
  }, [db, query, activeLesson]);

  const selectLesson = (i: number) => {
    setActiveLesson(i);
    const saved = progressRef.current.queries[LESSONS[i].id] ?? LESSONS[i].query;
    setQuery(saved);
    setResults([]);
    setColumns([]);
    setError('');
    setRan(false);
    progressRef.current.activeLesson = i;
    saveProgress(progressRef.current);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runQuery();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [runQuery]);

  const lesson = LESSONS[activeLesson];

  // Subtle warm-glow lighting from the front of the room (where the chalkboard is)
  const roomLightingStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    background: `radial-gradient(ellipse at 60% 0%, rgba(227,180,101,0.06) 0%, transparent 55%)`,
  };

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={roomLightingStyle} />
        <div style={{ color: c.muted, fontFamily: 'system-ui, sans-serif', fontSize: '14px', position: 'relative', zIndex: 1 }}>Loading SQL engine…</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: c.bg,
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      color: c.text,
      position: 'relative',
    }}>
      <div style={roomLightingStyle} />

      {/* Locker bank — sidebar on desktop, horizontal strip on mobile */}
      <div style={{
        width: isMobile ? '100%' : '240px',
        background: c.sidebar,
        backgroundImage: `repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 60px)`,
        borderRight: isMobile ? 'none' : `2px solid ${c.border}`,
        borderBottom: isMobile ? `2px solid ${c.border}` : 'none',
        flexShrink: 0,
        overflowY: isMobile ? 'visible' : 'auto',
        position: 'relative',
        zIndex: 1,
        boxShadow: isMobile ? `inset 0 -6px 12px rgba(0,0,0,0.35)` : `inset -6px 0 12px rgba(0,0,0,0.35)`,
      }}>
        <div style={{
          padding: '20px 16px 12px',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.22em',
          color: c.chalkDust,
          textTransform: 'uppercase',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${c.border}`,
          marginBottom: 8,
        }}>
          <span>SQL Lockers</span>
          <span style={{ color: c.accent, fontWeight: 700 }}>{completed.length}/{LESSONS.length}</span>
        </div>
        {allDone && !submittedScore && (
          <div
            style={{
              padding: '6px 16px 12px',
              borderBottom: `1px solid ${c.border}`,
              marginBottom: 6,
            }}
          >
            <button
              onClick={() => setShowScoreEntry(true)}
              style={{
                width: '100%',
                background: c.accent,
                color: c.sidebar,
                border: 'none',
                padding: '10px 12px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                borderRadius: 3,
              }}
            >
              ✦ Submit your score
            </button>
          </div>
        )}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          padding: isMobile ? '0 10px 10px' : '0 10px 12px',
          gap: 6,
          overflowX: isMobile ? 'auto' : 'visible',
        }}>
          {LESSONS.map((l, i) => {
            const done = completed.includes(l.id);
            const active = i === activeLesson;
            return (
              <button
                key={l.id}
                onClick={() => selectLesson(i)}
                style={{
                  position: 'relative',
                  width: isMobile ? 'auto' : '100%',
                  minWidth: isMobile ? 150 : undefined,
                  flexShrink: isMobile ? 0 : undefined,
                  textAlign: 'left',
                  padding: '12px 14px 12px 18px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: active ? c.accent : `linear-gradient(180deg, ${c.borderHL} 0%, ${c.border} 100%)`,
                  color: active ? c.sidebar : c.text,
                  border: `1px solid ${active ? c.accentHover : c.borderHL}`,
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  // Locker face: a faint vent line up top, like real school lockers
                  boxShadow: `inset 0 1px 0 rgba(255,235,200,0.08), 0 2px 4px rgba(0,0,0,0.3)`,
                  letterSpacing: '0.02em',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.title}
                </span>
                <span
                  title={done ? 'Completed' : active ? 'In progress' : 'Locker closed'}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: done ? c.lessonDone : active ? c.sidebar : 'rgba(0,0,0,0.5)',
                    boxShadow: done ? `0 0 6px ${c.lessonDone}` : 'inset 0 0 2px rgba(0,0,0,0.6)',
                  }}
                />
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            if (!confirm('Reset all progress?')) return;
            const fresh = { activeLesson: 0, queries: {}, completed: [] };
            progressRef.current = fresh;
            saveProgress(fresh);
            setCompleted([]);
            selectLesson(0);
          }}
          style={{
            margin: '0 16px 18px',
            padding: '8px 12px',
            background: 'none',
            border: `1px solid ${c.border}`,
            borderRadius: 3,
            color: c.muted,
            fontSize: 11,
            cursor: 'pointer',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          Reset Progress
        </button>
      </div>

      {/* Main classroom area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Chalkboard — replaces the village banner + concept speech bubble */}
        <div style={{
          padding: '20px 28px 8px',
          background: c.wall,
          borderBottom: `1px solid ${c.border}`,
        }}>
          <div style={{
            position: 'relative',
            background: c.chalkboard,
            border: `10px solid ${c.chalkFrame}`,
            borderRadius: 4,
            padding: '22px 26px 24px',
            color: c.chalk,
            // Subtle chalk dust on the green slate
            backgroundImage:
              `radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),` +
              `radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)`,
            backgroundSize: '14px 14px, 22px 22px',
            backgroundPosition: '0 0, 7px 11px',
            boxShadow: `0 4px 0 ${c.chalkFrame}, 0 10px 20px rgba(0,0,0,0.45), inset 0 0 30px rgba(0,0,0,0.35)`,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 8 : 22,
            alignItems: isMobile ? 'center' : 'flex-start',
          }}>
            {/* Uel pinned to the left (or above on mobile) */}
            <div style={{ flexShrink: 0 }}>
              <ProfessorUel scale={isMobile ? 0.45 : 0.6} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: '"Bradley Hand", "Comic Sans MS", "Marker Felt", cursive',
                fontSize: '24px',
                lineHeight: 1.1,
                color: c.chalk,
                marginBottom: 14,
                letterSpacing: '0.01em',
                textShadow: '0 1px 0 rgba(0,0,0,0.25)',
              }}>
                {lesson.title}
              </div>
              <pre style={{
                fontSize: '14px',
                lineHeight: '1.7',
                color: c.chalk,
                fontFamily: '"Bradley Hand", "Comic Sans MS", "Marker Felt", cursive',
                whiteSpace: 'pre-wrap',
                margin: 0,
                fontWeight: 400,
              }}>
                {lesson.concept}
              </pre>
            </div>
          </div>
        </div>

        {/* Wooden desk — wraps the query editor like an actual desk surface */}
        <div style={{
          padding: '24px 28px',
          borderBottom: `1px solid ${c.border}`,
          background: c.desk,
          // Wooden plank grain along the desk: horizontal subtle stripes
          backgroundImage:
            `repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 1px, transparent 1px 3px),` +
            `repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 80px)`,
          boxShadow: `inset 0 6px 12px rgba(0,0,0,0.3)`,
        }}>
          <div style={{
            background: c.deskTop,
            backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 6px)`,
            border: `1px solid ${c.border}`,
            borderRadius: 4,
            padding: '16px 18px',
            boxShadow: `0 4px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,235,200,0.12)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.22em', color: c.chalk, textTransform: 'uppercase' }}>
                Query Editor <span style={{ fontWeight: 400, letterSpacing: '0.04em', color: c.chalkDust, marginLeft: 8 }}>⌘ Enter to run</span>
              </div>
              <button
                onClick={runQuery}
                style={{
                  padding: '7px 18px',
                  background: c.accent,
                  color: c.sidebar,
                  border: `1px solid ${c.accentHover}`,
                  borderRadius: 3,
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: 'ui-monospace, monospace',
                  transition: 'background 0.15s',
                  boxShadow: `0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = c.accentHover)}
                onMouseLeave={e => (e.currentTarget.style.background = c.accent)}
              >
                Run
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                persistQuery(LESSONS[activeLesson].id, e.target.value);
              }}
              rows={6}
              spellCheck={false}
              style={{
                width: '100%',
                background: c.codeBg,
                border: `1px solid ${c.border}`,
                borderRadius: 3,
                padding: '14px 16px',
                color: c.chalk,
                fontSize: '13px',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                lineHeight: '1.6',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                caretColor: c.chalk,
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = c.accent)}
              onBlur={e => (e.currentTarget.style.borderColor = c.border)}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: c.chalkDust, fontStyle: 'italic' }}>
              Hint: {lesson.hint}
            </div>
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          {!ran && (
            <div style={{ fontSize: '13px', color: c.muted }}>Run a query to see results.</div>
          )}
          {ran && error && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: c.muted, textTransform: 'uppercase', marginBottom: '8px' }}>Error</div>
              <div style={{ fontSize: '13px', color: c.error, fontFamily: 'ui-monospace, monospace' }}>{error}</div>
            </div>
          )}
          {ran && !error && results.length === 0 && (
            <div style={{ fontSize: '13px', color: c.muted }}>Query ran successfully. No rows returned.</div>
          )}
          {ran && !error && results.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: c.muted, textTransform: 'uppercase', marginBottom: '12px' }}>
                {results.length} row{results.length !== 1 ? 's' : ''} returned
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: '13px', width: '100%', fontFamily: 'ui-monospace, monospace' }}>
                  <thead>
                    <tr>
                      {columns.map(col => (
                        <th key={col} style={{
                          padding: '8px 16px',
                          textAlign: 'left',
                          borderBottom: `1px solid ${c.border}`,
                          color: c.muted,
                          fontWeight: 600,
                          fontSize: '11px',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : c.rowAlt }}>
                        {columns.map(col => (
                          <td key={col} style={{
                            padding: '8px 16px',
                            borderBottom: `1px solid ${c.border}`,
                            color: row[col] === null ? c.muted : c.text,
                            whiteSpace: 'nowrap',
                          }}>
                            {row[col] === null ? 'NULL' : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showScoreEntry && (
        <div
          onClick={() => setShowScoreEntry(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,10,5,0.78)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1d28',
              border: `1px solid ${c.accent}`,
              padding: 8,
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            }}
          >
            <ScoreEntry
              game="learning"
              score={completed.length}
              accent={c.accent}
              dim={c.muted}
              font={'Georgia, "Iowan Old Style", serif'}
              onDone={() => {
                try { localStorage.setItem(SUBMIT_KEY, '1'); } catch {}
                setSubmittedScore(true);
                setShowScoreEntry(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
