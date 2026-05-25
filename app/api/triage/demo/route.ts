import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TRIAGE_DIR = join(process.cwd(), 'app', 'triage');
const KB_PATH = join(TRIAGE_DIR, 'knowledge-base.md');
const DIR_PATH = join(TRIAGE_DIR, 'directory.md');

let cachedDocs: string | null = null;
function loadDocs(): string {
  if (cachedDocs) return cachedDocs;
  const kb = safeRead(KB_PATH);
  const dir = safeRead(DIR_PATH);
  cachedDocs = `## Knowledge Base\n${kb}\n\n## Directory\n${dir}`;
  return cachedDocs;
}

function safeRead(p: string): string {
  try { return readFileSync(p, 'utf8'); } catch { return ''; }
}

interface Msg { role: 'user' | 'assistant'; content: string }

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return new Response('GROQ_API_KEY not configured', { status: 500 });

  let body: { messages?: Msg[] };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  const history = (body.messages ?? []).filter(
    (m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim()
  );
  if (history.length === 0) return new Response('No messages', { status: 400 });

  const system = `You are Helios, a SunPower triage demo assistant. Voice: warm, plainspoken, occasionally wry — a teammate, not a corporate bot. Keep answers short, direct, and useful.

Rules:
- No markdown, no lists, no headers. Plain sentences.
- Address the person as "you".
- Never fabricate product facts. If the docs below don't cover something, say so plainly and (when relevant) point them at the right person from the Directory.
- Never ask more than one question per turn. Don't ask meta-permission questions like "want me to look that up?" — just answer.

DOCS:
---
${loadDocs()}
---`;

  const client = new Groq({ apiKey });
  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 500,
    temperature: 0.4,
    stream: true,
    messages: [
      { role: 'system', content: system },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
