#!/usr/bin/env node
// OBSOLETE as of 2026-11-07 — the map now derives financiers at runtime from
// lib/sales-ops/resources-content.json via lib/sales-ops/derive-financiers.ts,
// so resources + map stay in lock-step with no build step. This script still
// writes a static financiers.json if you want one for debugging, but nothing
// in the app reads it anymore. Safe to delete.
// Reconciles with serviceable-states.json: if the union differs, logs the diff
// and rewrites serviceable-states.json from the finance table so the map and
// the resources tab stay consistent.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const RES = path.join(ROOT, 'lib/sales-ops/resources-content.json');
const SERV = path.join(ROOT, 'public/sales-ops/data/serviceable-states.json');
const OUT = path.join(ROOT, 'public/sales-ops/data/financiers.json');

const resources = JSON.parse(fs.readFileSync(RES, 'utf8'));
const finance = resources.tabs.find(t => t.key === 'finance');
if (!finance) throw new Error('No finance tab in resources.json');

const compare = finance.sections.find(s => s.kind === 'table');
if (!compare) throw new Error('No comparison table in finance tab');

const headings = compare.content.headings; // ["Category", "Concert Finance / Propel", ...]
const rows = compare.content.rows;
const activeStatesRow = rows.find(r => r[0] === 'Active States');
if (!activeStatesRow) throw new Error('No Active States row in finance table');

const STATE_RE = /\b([A-Z]{2})\b/g;
const NON_STATES = new Set(['NA', 'NTP', 'DTI', 'TPO', 'PPA', 'ACH', 'ID', 'WA']);
// "ID" and "WA" are real state codes but also collide with abbreviations. We
// intentionally keep them — they are legit active states — and strip the other
// three via the Active States column being unambiguous in context.

function parseStates(cell) {
  // The cell may look like "CA, CO, FL (Concert) · CA, CO, CT, ME (Propel)".
  // Pull every 2-letter uppercase token that's a known US state abbreviation.
  const VALID = new Set(['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']);
  const out = new Set();
  const matches = cell.match(STATE_RE) ?? [];
  for (const m of matches) if (VALID.has(m)) out.add(m);
  return [...out].sort();
}

const financiers = [];
for (let i = 1; i < headings.length; i++) {
  const name = headings[i];
  const cell = activeStatesRow[i] ?? '';
  const states = parseStates(cell);
  // PayKeeper has "N/A" in Active States (not a lender) — skip.
  if (states.length === 0) continue;
  const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  financiers.push({ key, name, states });
}

const union = new Set();
for (const f of financiers) for (const s of f.states) union.add(s);

const prev = JSON.parse(fs.readFileSync(SERV, 'utf8'));
const prevSet = new Set(prev.states ?? []);

const added = [...union].filter(s => !prevSet.has(s)).sort();
const removed = [...prevSet].filter(s => !union.has(s)).sort();

const output = {
  updatedAt: new Date().toISOString(),
  source: 'Derived from resources.json finance tab Active States column',
  financiers,
};
fs.writeFileSync(OUT, JSON.stringify(output, null, 2) + '\n');
console.log(`Wrote ${financiers.length} financiers covering ${union.size} states → ${path.relative(ROOT, OUT)}`);

if (added.length || removed.length) {
  console.log('\nReconciling serviceable-states.json with the finance table:');
  if (added.length) console.log('  + adding:   ', added.join(', '));
  if (removed.length) console.log('  - removing: ', removed.join(', '));
  const nextServ = {
    updatedAt: new Date().toISOString(),
    states: [...union].sort(),
  };
  fs.writeFileSync(SERV, JSON.stringify(nextServ, null, 2) + '\n');
  console.log(`  Wrote ${path.relative(ROOT, SERV)}`);
} else {
  console.log('\nserviceable-states.json already matches the finance table union.');
}
