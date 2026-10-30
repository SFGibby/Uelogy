#!/usr/bin/env node
// One-shot extractor: pulls const blocks out of public/sales-ops/map.html
// and splits them into standalone JSON files the React map loads at runtime.
//
// Run once per data refresh:
//   node scripts/extract-map-data.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const HTML = join(ROOT, 'public/sales-ops/map.html');
const OUT = join(ROOT, 'public/sales-ops/data');

mkdirSync(OUT, { recursive: true });

const src = readFileSync(HTML, 'utf8');

// Match-brace extractor. Starts at the first { or [ after the match pattern,
// walks the string while tracking string literals and escapes, returns the
// JSON substring.
function extractBlock(label, open) {
  // Allow optional whitespace between the name and the '=' and after it.
  const pattern = new RegExp(label.replace(/\s+/g, '\\s*') + '\\s*', 'm');
  const match = pattern.exec(src);
  if (!match) throw new Error(`not found: ${label}`);
  const idx = match.index + match[0].length;
  let i = src.indexOf(open, idx);
  if (i === -1) throw new Error(`no opening '${open}' after ${label}`);
  const start = i;
  const close = open === '{' ? '}' : ']';
  let depth = 0, inStr = false, strCh = '', esc = false;
  for (; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === strCh) inStr = false;
      continue;
    }
    if (c === '"' || c === "'") { inStr = true; strCh = c; continue; }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated ${label}`);
}

function pullObject(label) {
  const literal = extractBlock(label, '{');
  // The inline source uses standard JSON \u2014 safe to JSON.parse.
  return JSON.parse(literal);
}

function pullArray(label) {
  const literal = extractBlock(label, '[');
  return JSON.parse(literal);
}

// META lives in a <script type="application/json" id="META">...</script> block
function pullScriptBlock(id) {
  const re = new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)</script>`);
  const m = re.exec(src);
  if (!m) throw new Error(`script#${id} not found`);
  return m[1];
}

const META = JSON.parse(pullScriptBlock('META'));

// AGG is pipe-delimited lines (same parser as install-speed.html)
const AGG_RAW = pullScriptBlock('AGG');
const AGG = {};
for (const line of AGG_RAW.trim().split('\n')) {
  const v = line.split('|');
  if (!v[0]) continue;
  AGG[v.slice(0, 6).join('|')] = v.slice(6).map((x) => (x === '' ? null : +x));
}

const DQ = pullArray('const DQ=');
const ZIP3 = pullArray('const ZIP3 =');
const TOPO = pullObject('const TOPO =');
const ZIP3_TOPO = pullObject('const ZIP3_TOPO =');
const ZCTA_R = pullObject('const ZCTA_R =');

// Top-level data (always loaded on map mount)
writeFileSync(
  join(OUT, 'map-data.json'),
  JSON.stringify({ META, DQ, ZIP3, AGG })
);

// US topology (always loaded; small)
writeFileSync(join(OUT, 'us-topo.json'), JSON.stringify(TOPO));

// ZIP3 topology (loaded when a state is first drilled)
writeFileSync(join(OUT, 'zip3-topo.json'), JSON.stringify(ZIP3_TOPO));

// Per-region ZCTA bundles (lazy-loaded on drill into a ZIP3)
mkdirSync(join(OUT, 'zcta'), { recursive: true });
for (const [region, topo] of Object.entries(ZCTA_R)) {
  writeFileSync(join(OUT, 'zcta', `${region}.json`), JSON.stringify(topo));
}

console.log('wrote:');
console.log(`  map-data.json  ${(JSON.stringify({META,DQ,ZIP3,AGG}).length / 1024 / 1024).toFixed(2)} MB`);
console.log(`  us-topo.json   ${(JSON.stringify(TOPO).length / 1024).toFixed(1)} KB`);
console.log(`  zip3-topo.json ${(JSON.stringify(ZIP3_TOPO).length / 1024 / 1024).toFixed(2)} MB`);
console.log(`  zcta/*.json    ${Object.keys(ZCTA_R).length} files`);
