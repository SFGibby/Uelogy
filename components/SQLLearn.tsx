'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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

const c = {
  bg: '#1a1a1a',
  sidebar: '#212121',
  border: '#2e2e2e',
  text: '#e5e5e5',
  muted: '#8a8a8a',
  accent: '#7c3aed',
  accentHover: '#6d28d9',
  codeBg: '#141414',
  rowAlt: '#1f1f1f',
  error: '#f87171',
};

export default function SQLLearn() {
  const [db, setDb] = useState<unknown>(null);
  const [ready, setReady] = useState(false);
  const [activeLesson, setActiveLesson] = useState(0);
  const [query, setQuery] = useState(LESSONS[0].query);
  const [results, setResults] = useState<Row[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [ran, setRan] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initSqlJs({ locateFile: () => '/sql-wasm.wasm' }).then((SQL: any) => {
      const database = new SQL.Database();
      database.run(SETUP_SQL);
      setDb(database);
      setReady(true);
    });
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setRan(true);
    }
  }, [db, query]);

  const selectLesson = (i: number) => {
    setActiveLesson(i);
    setQuery(LESSONS[i].query);
    setResults([]);
    setColumns([]);
    setError('');
    setRan(false);
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

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: c.muted, fontFamily: 'system-ui, sans-serif', fontSize: '14px' }}>Loading SQL engine…</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: c.bg,
      display: 'flex',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      color: c.text,
    }}>
      {/* Sidebar */}
      <div style={{
        width: '220px',
        background: c.sidebar,
        borderRight: `1px solid ${c.border}`,
        flexShrink: 0,
        overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 16px 12px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: c.muted, textTransform: 'uppercase' }}>
          SQL Fundamentals
        </div>
        {LESSONS.map((l, i) => (
          <button
            key={l.id}
            onClick={() => selectLesson(i)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 16px',
              fontSize: '13px',
              background: i === activeLesson ? '#2a2a2a' : 'transparent',
              color: i === activeLesson ? c.text : c.muted,
              border: 'none',
              borderLeft: i === activeLesson ? `2px solid ${c.accent}` : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {l.title}
          </button>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Concept */}
        <div style={{
          padding: '24px 28px',
          borderBottom: `1px solid ${c.border}`,
          background: c.bg,
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: c.muted, textTransform: 'uppercase', marginBottom: '12px' }}>
            Concept
          </div>
          <pre style={{
            fontSize: '14px',
            lineHeight: '1.7',
            color: c.text,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            whiteSpace: 'pre-wrap',
            margin: 0,
          }}>
            {lesson.concept}
          </pre>
        </div>

        {/* Query editor */}
        <div style={{ padding: '20px 28px', borderBottom: `1px solid ${c.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: c.muted, textTransform: 'uppercase' }}>
              Query Editor <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— ⌘ Enter to run</span>
            </div>
            <button
              onClick={runQuery}
              style={{
                padding: '6px 16px',
                background: c.accent,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
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
            onChange={e => setQuery(e.target.value)}
            rows={6}
            spellCheck={false}
            style={{
              width: '100%',
              background: c.codeBg,
              border: `1px solid ${c.border}`,
              borderRadius: '8px',
              padding: '14px 16px',
              color: c.text,
              fontSize: '13px',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              lineHeight: '1.6',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
              caretColor: c.text,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = c.accent)}
            onBlur={e => (e.currentTarget.style.borderColor = c.border)}
          />
          <div style={{ marginTop: '8px', fontSize: '12px', color: c.muted }}>
            Hint: {lesson.hint}
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
    </div>
  );
}
