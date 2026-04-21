import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteBucket = 'SALES-OPS' | 'DIRECT-SALES' | 'EPC' | 'PIP' | 'NONE';
type Urgency = 'URGENT' | 'NORMAL' | 'LOW';

interface TriageResult {
  bucket: RouteBucket;
  urgency: Urgency;
  reason: string;
  evidence: string;
  needsMoreInfo: boolean;
  followupQuestion?: string;
}

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatTurn[];
  repName?: string;
}

const KB_PATH = join(process.cwd(), 'app', 'sales', 'knowledge-base.md');

function loadKnowledgeBase(): string {
  try {
    return readFileSync(KB_PATH, 'utf8');
  } catch {
    return '(knowledge base not found)';
  }
}

const SYSTEM_PROMPT = `You are the SunPower Sales Appointment Assistant. You help field and direct sales reps who are mid-appointment and hit technical or product questions they can't answer.

CORE RULES:
1. Be extremely brief. Reps are in front of a customer — answers must be one or two sentences max, confident, and usable on the spot. Offer to elaborate only if asked.
2. NEVER make up product facts. If the knowledge base below doesn't cover it, say "I don't have that in my notes — escalating to Sales Ops" and mark the turn for escalation.
3. You will also classify urgency using the rubric in the knowledge base. Reps routinely mark things as "urgent" when they aren't. Do not trust self-reported urgency; require evidence matching the rubric.
4. If a rep says something is urgent but hasn't given concrete evidence (customer walking, signature blocked, outage, safety), ask ONE short clarifying question before escalating.
5. For routing: use the product-line and deal-stage context to pick the right bucket (SALES-OPS / DIRECT-SALES / EPC / PIP / NONE).

KNOWLEDGE BASE:
---
${loadKnowledgeBase()}
---

Always reply in plain conversational text — no markdown headers, no bullet lists unless specifically asked.`;

const TRIAGE_SYSTEM_PROMPT = `You classify sales-appointment messages for routing. Output a JSON object matching the schema. Be strict about urgency — the rep saying "urgent" alone is not evidence.

URGENCY RUBRIC:
- URGENT: customer actively threatening to walk in this appointment, blocking a signature, safety/code/legal risk, or post-install outage.
- NORMAL: real technical question but no signature/walkaway pressure.
- LOW: curiosity, post-sale scheduling, no customer present.

ROUTING BUCKETS:
- SALES-OPS: urgent or technical mid-appointment issues
- DIRECT-SALES: post-sale issues from SunPower direct sales channel
- EPC: post-sale issues from EPC/field sales partners
- PIP: post-sale issues from the Preferred Installer Program
- NONE: simple in-appointment question, answerable from knowledge base, no escalation needed

If the rep has not given enough context to decide bucket OR to confirm urgency, set needsMoreInfo=true and supply ONE short followupQuestion that a sales rep would actually find useful (deal stage, product line, what the customer is doing right now, which partner channel).`;

async function triage(
  client: Anthropic,
  messages: ChatTurn[]
): Promise<TriageResult> {
  const latest = messages.filter((m) => m.role === 'user').slice(-3);
  const conversationText = latest
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: TRIAGE_SYSTEM_PROMPT,
    tools: [
      {
        name: 'classify',
        description: 'Classify the rep message for routing',
        input_schema: {
          type: 'object',
          properties: {
            bucket: {
              type: 'string',
              enum: ['SALES-OPS', 'DIRECT-SALES', 'EPC', 'PIP', 'NONE'],
            },
            urgency: {
              type: 'string',
              enum: ['URGENT', 'NORMAL', 'LOW'],
            },
            reason: {
              type: 'string',
              description: 'One sentence on why this bucket/urgency was chosen.',
            },
            evidence: {
              type: 'string',
              description:
                'Exact phrase(s) from the rep that justify URGENT classification, or "none" if not urgent.',
            },
            needsMoreInfo: {
              type: 'boolean',
              description:
                'True if the rep message lacks enough context to confidently route or assess urgency.',
            },
            followupQuestion: {
              type: 'string',
              description:
                'If needsMoreInfo is true, one short question a rep in an appointment would find useful.',
            },
          },
          required: [
            'bucket',
            'urgency',
            'reason',
            'evidence',
            'needsMoreInfo',
          ],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'classify' },
    messages: [{ role: 'user', content: conversationText }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    return {
      bucket: 'NONE',
      urgency: 'LOW',
      reason: 'triage failed',
      evidence: 'none',
      needsMoreInfo: false,
    };
  }
  return toolUse.input as TriageResult;
}

async function generateReply(
  client: Anthropic,
  messages: ChatTurn[]
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock && textBlock.type === 'text'
    ? textBlock.text
    : '(no response)';
}

async function escalate(
  triage: TriageResult,
  messages: ChatTurn[],
  repName: string
) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  const tag = `[${triage.bucket}]`;
  const urgTag = triage.urgency === 'URGENT' ? '[URGENT]' : '';
  const subject = `${urgTag}${tag} Sales bot escalation — ${repName}`;

  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'REP' : 'BOT'}: ${m.content}`)
    .join('\n\n');

  const body = `Rep: ${repName}
Urgency: ${triage.urgency}
Bucket: ${triage.bucket}
Classifier reason: ${triage.reason}
Evidence: ${triage.evidence}

--- Transcript ---
${transcript}
`;

  await transporter.sendMail({
    from: user,
    to: 'samuel.gibson@sunpower.com',
    subject,
    text: body,
  });
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

  const client = new Anthropic({ apiKey });
  const repName = body.repName?.trim() || 'Unknown rep';

  const [triageResult, reply] = await Promise.all([
    triage(client, body.messages),
    generateReply(client, body.messages),
  ]);

  const escalated =
    triageResult.bucket !== 'NONE' && !triageResult.needsMoreInfo;

  if (escalated) {
    try {
      await escalate(triageResult, body.messages, repName);
    } catch (err) {
      console.error('[sales-bot] escalation email failed', err);
    }
  }

  return NextResponse.json({
    reply,
    triage: triageResult,
    escalated,
  });
}
