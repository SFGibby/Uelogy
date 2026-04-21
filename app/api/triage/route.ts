import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Mode = 'in_appt' | 'about_to' | 'lost' | 'need_somebody';
type RouteBucket = 'SALES-OPS' | 'DIRECT-SALES' | 'EPC' | 'PIP' | 'NONE';
type Urgency = 'URGENT' | 'NORMAL' | 'LOW';

interface TriageResult {
  bucket: RouteBucket;
  urgency: Urgency;
  reason: string;
}

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatTurn[];
  repName?: string;
  mode: Mode;
}

const KB_PATH = join(process.cwd(), 'app', 'triage', 'knowledge-base.md');

function loadKnowledgeBase(): string {
  try {
    return readFileSync(KB_PATH, 'utf8');
  } catch {
    return '(knowledge base not found)';
  }
}

const MODE_CONFIG: Record<
  Mode,
  { urgency: Urgency; alwaysEscalate: boolean; tone: string; label: string }
> = {
  in_appt: {
    urgency: 'URGENT',
    alwaysEscalate: false,
    label: 'In Appointment',
    tone: `You are in a rep's ear RIGHT NOW. A customer is watching them.
- Answer in ONE sentence. Plain, confident, usable out loud.
- Zero preamble. No "great question". No markdown. No lists.
- If the knowledge base doesn't clearly cover it, say "I don't have that locked in — I'm looping in Sales Ops now, keep the conversation going." Do not guess.
- If the rep is clearly blocked on a signature, say so in a follow-up sentence and escalate.`,
  },
  about_to: {
    urgency: 'NORMAL',
    alwaysEscalate: false,
    label: 'About to be in an Appointment',
    tone: `The rep is prepping — minutes away from the door.
- Give a tight 2-4 sentence brief they can internalize fast.
- Anticipate the obvious objection for whatever product they mention.
- Ask them one useful prep question if they gave no context (product line OR customer type, not both).
- Friendly-direct, like a colleague walking them to the door.`,
  },
  lost: {
    urgency: 'LOW',
    alwaysEscalate: false,
    label: "I'm Lost",
    tone: `The rep doesn't quite know what they need yet. Be patient and warm.
- Start by reflecting back what you think they're asking, then help narrow it.
- Ask one clarifying question if needed, never more.
- Keep it conversational, like a senior rep grabbing coffee with a new hire.
- No jargon unless they use it first.`,
  },
  need_somebody: {
    urgency: 'URGENT',
    alwaysEscalate: true,
    label: 'Help, I need somebody',
    tone: `This mode is for when the rep wants a human — not a bot answer.
- Acknowledge warmly and briefly that you're routing them.
- Do NOT try to solve the problem yourself. Do NOT give product facts.
- Ask for the bare minimum still needed for the escalation email: product line (Direct / EPC / PIP) and what's happening right now, IF the rep hasn't already said.
- Once you have enough, confirm: "Sending this to Sam now — he'll get back to you."`,
  },
};

function buildSystemPrompt(mode: Mode): string {
  const cfg = MODE_CONFIG[mode];
  return `You are the SunPower Triage assistant — a teammate, not a bot. You talk like a real person on the team: warm, plainspoken, occasionally wry, never corporate.

CURRENT MODE: ${cfg.label}
${cfg.tone}

UNIVERSAL RULES:
- Never fabricate product facts. If the knowledge base doesn't cover it, say so.
- Never ask more than one question per turn.
- Never use bullet lists, headers, or markdown formatting in replies.
- Address the rep directly ("you"), not in the third person.

KNOWLEDGE BASE:
---
${loadKnowledgeBase()}
---`;
}

const BUCKET_SYSTEM_PROMPT = `You pick ONE routing bucket for a sales rep's message. Output via the classify tool.

BUCKETS:
- SALES-OPS: mid-appointment blockers, urgent technical questions, anything that needs Sam NOW
- DIRECT-SALES: post-sale issue from SunPower direct sales channel
- EPC: post-sale issue from an EPC/field-sales partner
- PIP: post-sale issue from the Preferred Installer Program
- NONE: in-appointment question fully answerable from knowledge base

Pick NONE only if the knowledge base clearly covers it. When uncertain between buckets, pick SALES-OPS — Sam would rather triage manually than have it misrouted.`;

async function classifyBucket(
  client: Anthropic,
  messages: ChatTurn[]
): Promise<{ bucket: RouteBucket; reason: string }> {
  const latest = messages.filter((m) => m.role === 'user').slice(-3);
  const text = latest.map((m) => `REP: ${m.content}`).join('\n');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 250,
    system: BUCKET_SYSTEM_PROMPT,
    tools: [
      {
        name: 'classify',
        description: 'Assign routing bucket',
        input_schema: {
          type: 'object',
          properties: {
            bucket: {
              type: 'string',
              enum: ['SALES-OPS', 'DIRECT-SALES', 'EPC', 'PIP', 'NONE'],
            },
            reason: { type: 'string' },
          },
          required: ['bucket', 'reason'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'classify' },
    messages: [{ role: 'user', content: text }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    return { bucket: 'SALES-OPS', reason: 'classifier fallback' };
  }
  return toolUse.input as { bucket: RouteBucket; reason: string };
}

async function generateReply(
  client: Anthropic,
  messages: ChatTurn[],
  mode: Mode
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: buildSystemPrompt(mode),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock && textBlock.type === 'text'
    ? textBlock.text
    : '(no response)';
}

async function escalate(
  bucket: RouteBucket,
  urgency: Urgency,
  reason: string,
  messages: ChatTurn[],
  repName: string,
  mode: Mode
) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return false;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  const urgTag = urgency === 'URGENT' ? '[URGENT]' : '';
  const subject = `${urgTag}[${bucket}] Triage escalation — ${repName}`;

  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'REP' : 'BOT'}: ${m.content}`)
    .join('\n\n');

  const body = `Rep: ${repName}
Mode: ${MODE_CONFIG[mode].label}
Urgency: ${urgency}
Bucket: ${bucket}
Classifier reason: ${reason}

--- Transcript ---
${transcript}
`;

  await transporter.sendMail({
    from: user,
    to: 'samuel.gibson@sunpower.com',
    subject,
    text: body,
  });
  return true;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 });
  }
  if (!body.mode || !(body.mode in MODE_CONFIG)) {
    return NextResponse.json({ error: 'valid mode required' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const repName = body.repName?.trim() || 'Unknown rep';
  const modeCfg = MODE_CONFIG[body.mode];

  const [bucketResult, reply] = await Promise.all([
    classifyBucket(client, body.messages),
    generateReply(client, body.messages, body.mode),
  ]);

  const triage: TriageResult = {
    bucket: bucketResult.bucket,
    urgency: modeCfg.urgency,
    reason: bucketResult.reason,
  };

  const shouldEscalate =
    modeCfg.alwaysEscalate ||
    (triage.bucket !== 'NONE' && triage.urgency === 'URGENT');

  let escalated = false;
  if (shouldEscalate) {
    try {
      escalated = await escalate(
        triage.bucket === 'NONE' ? 'SALES-OPS' : triage.bucket,
        triage.urgency,
        triage.reason,
        body.messages,
        repName,
        body.mode
      );
    } catch (err) {
      console.error('[triage] escalation email failed', err);
    }
  }

  return NextResponse.json({ reply, triage, escalated });
}
