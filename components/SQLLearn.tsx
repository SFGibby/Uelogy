'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

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
    title: '00. WHAT IS SQL',
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
    title: '01. SELECT COLUMNS',
    concept: `Instead of grabbing everything with *, you can pick specific columns.

This is useful when tables have 30 columns and you only need 3.`,
    query: `SELECT name, region FROM reps;`,
    hint: 'List the columns you want, separated by commas.',
  },
  {
    id: 'where',
    title: '02. WHERE (FILTERING)',
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
    title: '10. REP LEADERBOARD',
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
    (window as any).initSqlJs({ locateFile: () => '/sql-wasm.wasm' }).then((SQL: any) => {
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

  const termStyle = {
    fontFamily: 'var(--font-vt323), monospace',
    color: '#33ff33',
    textShadow: '0 0 6px #33ff33',
  };

  const dimStyle = { color: '#1aaa1a', textShadow: 'none' };

  if (!ready) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" style={termStyle}>
        <div>LOADING SQL ENGINE...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col" style={termStyle}>
      {/* Header */}
      <div className="border-b border-[#1aaa1a] px-6 py-3 flex items-center justify-between">
        <div>
          <span style={dimStyle}>{'> '}</span>
          <span>SQL CRASH COURSE</span>
          <span className="ml-4 text-sm" style={dimStyle}>// SOLAR SALES DATABASE</span>
        </div>
        <span></span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Lesson list sidebar */}
        <div className="w-56 border-r border-[#1aaa1a] overflow-y-auto flex-shrink-0">
          {LESSONS.map((l, i) => (
            <button
              key={l.id}
              onClick={() => selectLesson(i)}
              className="w-full text-left px-4 py-3 text-sm border-b border-[#0d660d] transition-colors"
              style={i === activeLesson ? { background: '#0a1a0a', color: '#33ff33' } : { ...dimStyle, background: 'transparent' }}
            >
              {l.title}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Concept panel */}
          <div className="border-b border-[#1aaa1a] px-6 py-4" style={{ background: '#020a02' }}>
            <div className="text-xs mb-3" style={dimStyle}>-- LESSON --</div>
            <pre className="text-sm leading-relaxed whitespace-pre-wrap" style={{ ...dimStyle, fontFamily: 'inherit' }}>
              {lesson.concept}
            </pre>
          </div>

          {/* Query editor */}
          <div className="border-b border-[#1aaa1a] px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={dimStyle}>-- QUERY EDITOR (Ctrl+Enter to run) --</span>
              <button
                onClick={runQuery}
                className="px-4 py-1 border border-[#33ff33] text-sm hover:bg-[#33ff33] hover:text-black transition-all"
                style={{ fontFamily: 'inherit' }}
              >
                RUN &gt;
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              rows={6}
              className="w-full bg-black border border-[#1aaa1a] px-4 py-3 text-sm outline-none resize-none focus:border-[#33ff33] transition-colors"
              style={{ fontFamily: 'var(--font-vt323), monospace', fontSize: '16px', color: '#33ff33', caretColor: '#33ff33' }}
              spellCheck={false}
            />
            <div className="mt-2 text-xs" style={dimStyle}>HINT: {lesson.hint}</div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto px-6 py-4">
            {!ran && (
              <div className="text-sm" style={dimStyle}>{'> PRESS RUN TO EXECUTE QUERY'}</div>
            )}
            {ran && error && (
              <div>
                <div className="text-xs mb-2" style={dimStyle}>-- ERROR --</div>
                <div className="text-sm" style={{ color: '#ff4444', textShadow: '0 0 6px #ff4444' }}>{error}</div>
              </div>
            )}
            {ran && !error && results.length === 0 && (
              <div className="text-sm" style={dimStyle}>{'> QUERY OK. NO ROWS RETURNED.'}</div>
            )}
            {ran && !error && results.length > 0 && (
              <div>
                <div className="text-xs mb-3" style={dimStyle}>-- {results.length} ROW{results.length !== 1 ? 'S' : ''} RETURNED --</div>
                <div className="overflow-x-auto">
                  <table className="text-sm border-collapse" style={{ fontFamily: 'inherit' }}>
                    <thead>
                      <tr>
                        {columns.map(col => (
                          <th key={col} className="px-4 py-1 text-left border-b border-[#1aaa1a]" style={dimStyle}>
                            {col.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : '#020a02' }}>
                          {columns.map(col => (
                            <td key={col} className="px-4 py-1 border-b border-[#0d660d]">
                              {row[col] === null ? <span style={dimStyle}>NULL</span> : String(row[col])}
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
    </div>
  );
}
