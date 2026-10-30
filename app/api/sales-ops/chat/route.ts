// Sales Ops chat — single-turn Q&A for the floating widget on the hub.
// Ports the KB loading + Groq flow out of /api/triage, trimmed for the
// sales-leader audience (no lane modes, no realtime session, no takeover).

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KB_DIR = join(process.cwd(), 'app', 'sales-ops', 'kb');
const KB_PATH = join(KB_DIR, 'knowledge-base.md');
const DIR_PATH = join(KB_DIR, 'directory.md');
const BRAIN_DIR = join(KB_DIR, 'brain');
const SKIP = new Set(['_template.md', 'README.md']);
const MODEL = 'llama-3.3-70b-versatile';
const MAX_INPUT_CHARS = 60_000;

let docsCache: string | null = null;

function safeRead(p: string): string {
  try { return readFileSync(p, 'utf8'); } catch { return ''; }
}

function collectBrainFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (name.name.startsWith('_source')) continue;
    const abs = join(dir, name.name);
    if (name.isDirectory()) collectBrainFiles(abs, out);
    else if (name.name.endsWith('.md') && !SKIP.has(name.name)) out.push(abs);
  }
  return out;
}

function loadBrainIndex(): string {
  const files = collectBrainFiles(BRAIN_DIR);
  if (files.length === 0) return '(no brain entries)';
  // Compact index: path + first H1 line only, to keep the prompt under TPM.
  return files
    .map(abs => {
      const rel = relative(KB_DIR, abs);
      const body = safeRead(abs);
      const title = (body.split('\n').find(l => l.startsWith('# ')) ?? '').replace(/^#\s*/, '').trim();
      return `- ${rel}${title ? ' — ' + title : ''}`;
    })
    .join('\n');
}

function loadDocs(): string {
  if (docsCache) return docsCache;
  const kb = safeRead(KB_PATH);
  const dirx = safeRead(DIR_PATH);
  const brain = loadBrainIndex();
  const out = `## Knowledge Base\n${kb}\n\n## Directory\n${dirx}\n\n## Brain Index\n${brain}`;
  docsCache = out.slice(0, MAX_INPUT_CHARS);
  return docsCache;
}

const SYSTEM_PROMPT = `You are the Sales Ops shortcut for SunPower sales leaders using uelogy.com/sales-ops.
You answer questions about SunPower Direct Ops: install speed, contacts, financing, equipment, adders, SLAs, team pacing, and rep performance.

Rules:
- Answer in 1-3 sentences, no preamble. If a link in the knowledge base fits the answer, include it.
- When you don't know, say so and name the team to contact from the Directory.
- Never invent numbers, SLAs, financier terms, or install dates.
- You are speaking to sales execs and regional managers, not reps in appointments.
- If the user asks something off-topic (not about SunPower Direct Ops), reply exactly: "That's outside what I can help with here."`;

interface ChatRequestBody {
  question?: string;
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const question = (body.question ?? '').trim();
  if (!question) {
    return NextResponse.json({ error: 'empty question' }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ answer: null, reason: 'no groq key configured' }, { status: 503 });
  }

  const groq = new Groq({ apiKey });
  const docs = loadDocs();

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: `Knowledge base follows. Treat it as the only source of truth.\n\n${docs}` },
        { role: 'user', content: question },
      ],
    });
    const answer = completion.choices[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ answer });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'groq failed', detail: msg }, { status: 502 });
  }
}
