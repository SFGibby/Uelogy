// Parse the Finance Resource Guide HTML into a structured tree.
// Runs on the server at render time; the output is passed to a client
// component that renders it with Pulse styling.

import { readFileSync } from 'fs';
import { join } from 'path';

export interface ResourceCard {
  title: string;
  body: string;   // HTML allowed (links, lists, bold)
  highlight: boolean;
}

export interface ResourceSection {
  id: string;
  title: string;
  cards: ResourceCard[];
}

export interface ResourceTab {
  key: string;
  label: string;
  sections: ResourceSection[];
}

const TAB_LABELS: Record<string, string> = {
  sales: 'Contact Guide',
  finance: 'Finance Resource Guide',
  calc: 'Financing Calculator',
  adders: 'Adders Guide',
  equipment: 'Equipment Guide',
  faqs: 'FAQs',
};

export function parseResources(): ResourceTab[] {
  const path = join(process.cwd(), 'public', 'sales-ops', 'resources.html');
  const html = readFileSync(path, 'utf-8');

  const tabs: ResourceTab[] = [];
  const pageMatches = html.matchAll(/<div class="page[^"]*" id="page-([a-z]+)"[^>]*>([\s\S]*?)(?=<div class="page[^"]*" id="page-[a-z]+"|<\/div>\s*<\/div>\s*<script)/g);

  for (const page of pageMatches) {
    const key = page[1];
    const label = TAB_LABELS[key] ?? key;
    const sections = extractSections(page[2]);
    tabs.push({ key, label, sections });
  }

  // Fallback if the regex didn't catch everything \u2014 try per-tab
  if (tabs.length === 0) {
    for (const key of Object.keys(TAB_LABELS)) {
      const re = new RegExp(`<div class="page[^"]*" id="page-${key}"[^>]*>([\\s\\S]*?)<\\/div>\\s*(?=<div class="page[^"]*" id="page-|<\\/div>\\s*<\\/div>\\s*<script)`, 's');
      const m = html.match(re);
      if (m) tabs.push({ key, label: TAB_LABELS[key], sections: extractSections(m[1]) });
    }
  }

  return tabs;
}

function extractSections(pageHtml: string): ResourceSection[] {
  const sections: ResourceSection[] = [];
  // Each section is a .financier wrapper
  const secRe = /<div class="financier[^"]*"[^>]*id="sec-([^"]+)"[^>]*>([\s\S]*?)(?=<div class="financier[^"]*"[^>]*id="sec-|<\/section>|<\/main>|<\/div>\s*<\/div>\s*<\/section>)/g;
  for (const m of pageHtml.matchAll(secRe)) {
    const id = m[1];
    const inner = m[2];
    const nameMatch = inner.match(/<div class="financier-name"[^>]*>([^<]+)<\/div>/);
    const title = nameMatch ? decode(nameMatch[1].trim()) : id;
    const cards = extractCards(inner);
    sections.push({ id, title, cards });
  }

  // Fallback for block titles outside the financier wrapper (quick comparison, etc.)
  const topTitleMatches = pageHtml.matchAll(/<h2 class="block-title"[^>]*>([^<]+)<\/h2>\s*<p class="block-desc"[^>]*>([^<]*)<\/p>/g);
  for (const m of topTitleMatches) {
    const title = decode(m[1].trim());
    const desc = decode(m[2].trim());
    if (!sections.find(s => s.title === title)) {
      sections.unshift({ id: title.toLowerCase().replace(/\s+/g, '-'), title, cards: desc ? [{ title: '', body: desc, highlight: false }] : [] });
    }
  }

  return sections;
}

function extractCards(sectionHtml: string): ResourceCard[] {
  const cards: ResourceCard[] = [];
  const cardRe = /<div class="info-card([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="info-card|<\/div>)/g;
  for (const m of sectionHtml.matchAll(cardRe)) {
    const highlight = m[1].includes('highlight');
    const inner = m[2];
    const titleMatch = inner.match(/<h4[^>]*>([^<]*)<\/h4>/);
    const title = titleMatch ? decode(titleMatch[1].trim()) : '';
    const bodyMatch = inner.match(/<div class="card-body"[^>]*>([\s\S]*?)<\/div>/);
    const body = bodyMatch ? sanitizeBody(bodyMatch[1].trim()) : '';
    if (!title && !body) continue;
    cards.push({ title, body, highlight });
  }
  return cards;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
}

function sanitizeBody(html: string): string {
  // Allow basic formatting; strip event handlers and inline styles for safety.
  let out = html;
  out = out.replace(/\s(on\w+)="[^"]*"/g, '');
  out = out.replace(/\sstyle="[^"]*"/g, '');
  out = out.replace(/<a\s+/g, '<a target="_blank" rel="noopener noreferrer" ');
  return out;
}
