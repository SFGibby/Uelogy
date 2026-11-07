// Single source of truth: resources-content.json drives the financier list
// the map uses. No separate financiers.json file, no build step to sync.

import type { Financier, FinanciersFile } from '../../components/sales-ops/map/types';
import resourcesContent from './resources-content.json';

// Reuse the same slug rule the old builder script used so URL keys
// (e.g. ?financier=concert-finance-propel) stay stable.
function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// "ID" and "WA" collide with common abbreviations in prose; filter them when
// they appear outside a 2-letter run. "NA" / "NTP" / "DTI" / "TPO" / "PPA" /
// "ACH" are definitely not states.
const STATE_WORD_RE = /\b([A-Z]{2})\b/g;
const NON_STATES = new Set(['NA', 'NTP', 'DTI', 'TPO', 'PPA', 'ACH']);
const VALID_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM',
  'NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA',
  'WV','WI','WY',
]);

function parseStates(cell: string): string[] {
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(STATE_WORD_RE);
  while ((m = re.exec(cell))) {
    const code = m[1];
    if (NON_STATES.has(code)) continue;
    if (!VALID_STATES.has(code)) continue;
    seen.add(code);
  }
  return [...seen].sort();
}

let cached: { file: FinanciersFile; serviceable: Set<string> } | null = null;

export function deriveFinanciers(): { file: FinanciersFile; serviceable: Set<string> } {
  if (cached) return cached;

  type Section = { kind?: string; title?: string; content?: { headings?: string[]; rows?: string[][] } };
  type Tab = { key: string; sections: Section[] };

  const tabs = (resourcesContent as { tabs: Tab[] }).tabs;
  const finance = tabs.find(t => t.key === 'finance');
  if (!finance) throw new Error('resources-content.json has no finance tab');

  const compare = finance.sections.find(s => s.kind === 'table' && s.title === 'Quick comparison');
  if (!compare?.content) throw new Error('resources-content.json has no Quick comparison table');

  const headings = compare.content.headings ?? [];
  const rows = compare.content.rows ?? [];
  const activeStatesRow = rows.find(r => r[0] === 'Active States');
  if (!activeStatesRow) throw new Error('resources-content.json finance table has no "Active States" row');

  const financiers: Financier[] = [];
  for (let i = 1; i < headings.length; i++) {
    const name = headings[i];
    const cell = activeStatesRow[i] ?? '';
    const states = parseStates(cell);
    if (states.length === 0) continue; // PayKeeper etc.
    financiers.push({ key: slug(name), name, states });
  }

  const serviceable = new Set<string>();
  for (const f of financiers) for (const s of f.states) serviceable.add(s);

  const file: FinanciersFile = {
    updatedAt: (resourcesContent as { updatedAt?: string }).updatedAt ?? '',
    source: 'Derived at runtime from resources-content.json finance tab',
    financiers,
  };

  cached = { file, serviceable };
  return cached;
}
