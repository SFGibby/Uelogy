#!/usr/bin/env node
// Pull the full Finance Resource Guide out of /public/sales-ops/resources.html
// and write it as structured JSON. Rerun whenever Colten updates the source
// HTML.
//
//   node scripts/extract-resources.mjs
//
// Output: public/sales-ops/data/resources.json

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'public', 'sales-ops', 'resources.html');
const OUT = join(ROOT, 'public', 'sales-ops', 'data', 'resources.json');

const html = readFileSync(SRC, 'utf8');

const TAB_LABELS = {
  sales: 'Contact Guide',
  finance: 'Finance',
  calc: 'Calculator',
  adders: 'Adders',
  equipment: 'Equipment',
  faqs: 'FAQs',
};

// --- primitives ----------------------------------------------------------

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripTags(s) {
  return decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function sanitize(innerHtml) {
  let out = innerHtml;
  out = out.replace(/\s(on\w+)="[^"]*"/g, '');
  out = out.replace(/\sstyle="[^"]*"/g, '');
  out = out.replace(/\scontenteditable="[^"]*"/g, '');
  out = out.replace(/<a\s+/g, '<a target="_blank" rel="noopener noreferrer" ');
  return out.trim();
}

// Grab the slice of HTML for a single <div class="page..." id="page-{key}">...
// up to the next sibling page div. We rely on the authored structure where
// each page is a top-level div inside the body.
function pageSlice(key) {
  const open = html.indexOf(`id="page-${key}"`);
  if (open === -1) return '';
  // Find start of opening tag before this id
  const divStart = html.lastIndexOf('<div', open);
  // Walk forward and track div depth to find the matching close.
  let i = divStart;
  let depth = 0;
  const re = /<\/?div\b[^>]*>/g;
  re.lastIndex = i;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith('</')) {
      depth--;
      if (depth === 0) return html.slice(divStart, m.index + m[0].length);
    } else {
      depth++;
    }
  }
  return html.slice(divStart);
}

// Match balanced <div ...>...</div>. Pass the index at the opening tag.
function matchBalancedDiv(src, openStart) {
  const re = /<\/?div\b[^>]*>/g;
  re.lastIndex = openStart;
  let depth = 0;
  let m;
  while ((m = re.exec(src))) {
    if (m[0].startsWith('</')) {
      depth--;
      if (depth === 0) return { end: m.index + m[0].length, inner: src.slice(openStart, m.index + m[0].length) };
    } else {
      depth++;
    }
  }
  return { end: src.length, inner: src.slice(openStart) };
}

function findAllDivsByClass(src, cls) {
  // Return list of { start, inner } for each <div class="..."> whose class list contains `cls`.
  const results = [];
  const re = /<div\s+class="([^"]*)"[^>]*>/g;
  let m;
  while ((m = re.exec(src))) {
    const classes = m[1].split(/\s+/);
    if (!classes.includes(cls)) continue;
    const { end, inner } = matchBalancedDiv(src, m.index);
    results.push({ start: m.index, end, inner, openTag: m[0], attrs: m[1] });
  }
  return results;
}

function attr(openTag, name) {
  const re = new RegExp(`\\s${name}="([^"]*)"`);
  const m = openTag.match(re);
  return m ? m[1] : '';
}

// --- unit extractors -----------------------------------------------------

function extractCards(sectionHtml) {
  const cards = [];
  const re = /<div\s+class="(info-card[^"]*)"[^>]*>/g;
  let m;
  while ((m = re.exec(sectionHtml))) {
    const classes = m[1];
    const { end, inner } = matchBalancedDiv(sectionHtml, m.index);
    const highlight = /\bhighlight\b/.test(classes);
    const titleMatch = inner.match(/<h4[^>]*>([\s\S]*?)<\/h4>/);
    const title = titleMatch ? stripTags(titleMatch[1]) : '';
    const bodyMatch = inner.match(/<div class="card-body"[^>]*>([\s\S]*?)<\/div>\s*(?=<div|$|<\/div)/);
    const body = bodyMatch ? sanitize(bodyMatch[1]) : '';
    if (title || body) cards.push({ title, body, highlight });
    re.lastIndex = end;
  }
  return cards;
}

function extractFinancierPanels(sectionHtml) {
  const panels = [];
  // Only match <div class="financier " ...> — the trailing space (or boundary)
  // distinguishes a real panel from .financier-pills / .financier-name / etc.
  const re = /<div\s+class="financier(?:\s+[^"]*)?"\s+id="([^"]+)"[^>]*>/g;
  let m;
  while ((m = re.exec(sectionHtml))) {
    const id = m[1];
    const { end, inner } = matchBalancedDiv(sectionHtml, m.index);
    const nameMatch = inner.match(/<div class="financier-name[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const name = nameMatch ? stripTags(nameMatch[1]) : id;
    const metaMatch = inner.match(/<div class="financier-meta"[^>]*>([\s\S]*?)<\/div>/);
    const meta = metaMatch ? stripTags(metaMatch[1]) : '';
    // Grab the body wrapper to limit card extraction to inside this panel.
    const bodyIdx = inner.indexOf('class="financier-body"');
    const bodyScope = bodyIdx >= 0 ? inner.slice(bodyIdx) : inner;
    const cards = extractCards(bodyScope);
    panels.push({ id, name, meta, cards });
    re.lastIndex = end;
  }
  return panels;
}

function extractTable(src, id) {
  const re = new RegExp(`<table[^>]*id="${id}"[^>]*>([\\s\\S]*?)</table>`);
  const m = src.match(re);
  if (!m) return null;
  const body = m[1];
  const headRow = body.match(/<thead[^>]*>([\s\S]*?)<\/thead>/);
  const headings = [];
  if (headRow) {
    const ths = [...headRow[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)];
    for (const th of ths) headings.push(stripTags(th[1]));
  }
  const rows = [];
  const bodyMatch = body.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
  if (bodyMatch) {
    const trs = [...bodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
    for (const tr of trs) {
      const cells = [...tr[1].matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/g)].map(c => sanitize(c[2]));
      if (cells.length) rows.push(cells);
    }
  }
  return { headings, rows };
}

function extractCategoryPills(pageHtml) {
  const pillBlock = pageHtml.match(/<div class="financier-pills"[^>]*>([\s\S]*?)<\/div>/);
  if (!pillBlock) return [];
  const pills = [...pillBlock[1].matchAll(/<button[^>]*data-(?:pill|catpill)="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)];
  return pills.map(p => ({ key: p[1], label: stripTags(p[2]) }));
}

function extractHero(pageHtml, key) {
  const h1 = pageHtml.match(/<h1[^>]*id="[^"]*"[^>]*>([\s\S]*?)<\/h1>/);
  const sub = pageHtml.match(/<p class="sub"[^>]*>([\s\S]*?)<\/p>/);
  return {
    title: h1 ? stripTags(h1[1]) : TAB_LABELS[key],
    subtitle: sub ? stripTags(sub[1]) : '',
  };
}

// --- per-page extractors -------------------------------------------------

function extractSalesPage() {
  const page = pageSlice('sales');
  const panels = extractFinancierPanels(page);
  const sections = [];

  // Contact directory table (if present on this page)
  const dir = extractTable(page, 'contactDirectoryTable');
  if (dir) {
    sections.push({
      kind: 'table',
      title: 'Quick contact directory',
      description: 'Fastest line to each support team.',
      content: dir,
    });
  }

  // Each financier panel becomes a section with info-cards.
  for (const p of panels) {
    sections.push({
      kind: 'cards',
      id: p.id,
      title: p.name,
      cards: p.cards,
    });
  }

  return { key: 'sales', label: TAB_LABELS.sales, hero: extractHero(page, 'sales'), sections };
}

function extractFinancePage() {
  const page = pageSlice('finance');
  const sections = [];
  const compare = extractTable(page, 'compareTable');
  if (compare) {
    sections.push({
      kind: 'table',
      title: 'Quick comparison',
      description: 'All partners, side by side.',
      content: compare,
    });
  }
  const panels = extractFinancierPanels(page);
  for (const p of panels) {
    sections.push({
      kind: 'financier',
      id: p.id,
      title: p.name,
      meta: p.meta,
      cards: p.cards,
    });
  }
  return {
    key: 'finance',
    label: TAB_LABELS.finance,
    hero: extractHero(page, 'finance'),
    pills: extractCategoryPills(page),
    sections,
  };
}

function extractCollapsiblePage(key) {
  const page = pageSlice(key);
  const panels = extractFinancierPanels(page);
  const sections = panels.map(p => ({
    kind: 'cards',
    id: p.id,
    title: p.name,
    cards: p.cards,
  }));
  return {
    key,
    label: TAB_LABELS[key],
    hero: extractHero(page, key),
    pills: extractCategoryPills(page),
    sections,
  };
}

function extractFaqsPage() {
  const page = pageSlice('faqs');
  const panels = extractFinancierPanels(page);
  // Each FAQ panel contains one card; flatten into {question, answer}.
  const items = panels.map(p => ({
    id: p.id,
    question: p.name,
    answer: p.cards[0]?.body ?? '',
  }));
  return {
    key: 'faqs',
    label: TAB_LABELS.faqs,
    hero: extractHero(page, 'faqs'),
    pills: extractCategoryPills(page),
    sections: [{ kind: 'faq', title: 'FAQs', content: { items } }],
  };
}

function extractCalcPage() {
  // Calc is an interactive widget. For the ported view we surface a brief
  // explainer card + a direct link back to the original HTML tool so leaders
  // can still open it in a side tab until a native calculator ships.
  const page = pageSlice('calc');
  const hero = extractHero(page, 'calc');
  return {
    key: 'calc',
    label: TAB_LABELS.calc,
    hero,
    sections: [
      {
        kind: 'cards',
        title: 'Comparison calculator',
        cards: [
          {
            title: 'Open the full calculator',
            body: '<p>The interactive financing comparison lives in the legacy guide — <a href="/sales-ops/resources.html#page-calc">open it in a new tab</a>. A native version is on the roadmap once the inputs stabilize.</p>',
            highlight: true,
          },
        ],
      },
    ],
  };
}

// --- run ------------------------------------------------------------------

const out = {
  updatedAt: new Date().toISOString(),
  tabs: [
    extractSalesPage(),
    extractFinancePage(),
    extractCalcPage(),
    extractCollapsiblePage('adders'),
    extractCollapsiblePage('equipment'),
    extractFaqsPage(),
  ],
};

writeFileSync(OUT, JSON.stringify(out, null, 2));

const summary = out.tabs.map(t => `${t.key}: ${t.sections.length} sections`).join(', ');
console.log(`Wrote ${OUT} — ${summary}`);
