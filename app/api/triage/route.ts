import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  adminClient,
  Mode,
  MODE_CONFIG,
  Bucket,
  Urgency,
  COPY,
  signToken,
  siteBaseUrl,
} from '../../../lib/triage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KB_PATH = join(process.cwd(), 'app', 'triage', 'knowledge-base.md');
const DIR_PATH = join(process.cwd(), 'app', 'triage', 'directory.md');

function loadDocs(): string {
  const kb = safeRead(KB_PATH);
  const dir = safeRead(DIR_PATH);
  return `## Knowledge Base\n${kb}\n\n## Directory\n${dir}`;
}

function safeRead(p: string): string {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '(file missing)';
  }
}

interface RequestBody {
  sessionId?: string;
  mode?: Mode;
  pledgeConfirmed?: boolean;
  message: string;
}

interface ClassifierResult {
  isWorkRelated: boolean;
  botCanAnswer: 'confident' | 'needs_clarification' | 'unknown';
  bucket: Bucket;
  bucketReason: string;
}

async function classify(
  client: Anthropic,
  latestUserMessage: string,
  draftReply: string,
  mode: Mode,
  attempts: number
): Promise<ClassifierResult> {
  const prompt = `MODE: ${MODE_CONFIG[mode].label} (attempts already made this session: ${attempts})

REP'S LATEST MESSAGE:
${latestUserMessage}

BOT'S DRAFT REPLY:
${draftReply}

Classify.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: `You evaluate a sales-triage exchange. Output the classify tool.

isWorkRelated: true unless the rep's message is clearly non-work (personal trivia, creative writing prompts, coding help unrelated to SunPower tools, relationship advice, etc.). If the message could plausibly relate to SunPower sales/ops/tools, set true.

botCanAnswer:
  - "confident": draft reply fully answers the question with facts from the knowledge base.
  - "needs_clarification": draft reply asks a clarifying question because one specific detail is missing.
  - "unknown": draft reply admits it doesn't know, or hedges, or the draft is a placeholder escalation message.

bucket: route destination if this eventually escalates. Pick from:
SALES-OPS, DIRECT-SALES, EPC, PIP, TECH-SUPPORT, ONBOARDING, SALES-ONBOARDING, COMMISSIONS, NONE.
Use NONE only if no escalation needed. When unsure between buckets, prefer SALES-OPS.`,
    tools: [
      {
        name: 'classify',
        description: 'Classify the triage exchange',
        input_schema: {
          type: 'object',
          properties: {
            isWorkRelated: { type: 'boolean' },
            botCanAnswer: {
              type: 'string',
              enum: ['confident', 'needs_clarification', 'unknown'],
            },
            bucket: {
              type: 'string',
              enum: [
                'SALES-OPS',
                'DIRECT-SALES',
                'EPC',
                'PIP',
                'TECH-SUPPORT',
                'ONBOARDING',
                'SALES-ONBOARDING',
                'COMMISSIONS',
                'NONE',
              ],
            },
            bucketReason: { type: 'string' },
          },
          required: ['isWorkRelated', 'botCanAnswer', 'bucket', 'bucketReason'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'classify' },
    messages: [{ role: 'user', content: prompt }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    return {
      isWorkRelated: true,
      botCanAnswer: 'unknown',
      bucket: 'SALES-OPS',
      bucketReason: 'classifier fallback',
    };
  }
  return toolUse.input as ClassifierResult;
}

async function generateReply(
  client: Anthropic,
  history: { role: 'user' | 'assistant'; content: string }[],
  mode: Mode
): Promise<string> {
  const cfg = MODE_CONFIG[mode];
  const system = `You are Helios, the SunPower Triage assistant — a real teammate's voice, not a corporate bot. Warm, plainspoken, occasionally wry. When asked your name, you're Helios.

LANE: ${cfg.label}
${cfg.tone}

UNIVERSAL RULES:
- Never fabricate product facts. If the docs below don't cover it, say so in the mode-appropriate phrasing.
- Never ask more than one question per turn.
- No markdown, no lists, no headers.
- Address the rep as "you".

When you genuinely don't have the answer and the lane says escalate, use these exact handoff phrases:
- In Appointment lane: "${COPY.IN_APPT_ESCALATION}"
- About to be lane (after hitting max attempts): "${COPY.ABOUT_TO_ESCALATION}"
- Prepping lane (genuine unknown): "${COPY.PREPPING_UNKNOWN}"
- Router lane (no directory match): "${COPY.ROUTER_UNKNOWN}"

DOCS:
---
${loadDocs()}
---`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system,
    messages: history,
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock && textBlock.type === 'text'
    ? textBlock.text
    : '(no response)';
}

function shouldEscalate(
  mode: Mode,
  botCanAnswer: ClassifierResult['botCanAnswer'],
  attemptsAfterThis: number
): boolean {
  const cfg = MODE_CONFIG[mode];
  if (mode === 'in_appt') return botCanAnswer !== 'confident';
  if (mode === 'about_to') {
    if (botCanAnswer === 'unknown') return true;
    if (cfg.maxAttempts != null && attemptsAfterThis >= cfg.maxAttempts)
      return botCanAnswer !== 'confident';
    return false;
  }
  if (mode === 'prepping') return botCanAnswer === 'unknown';
  if (mode === 'router') return botCanAnswer === 'unknown';
  return false;
}

async function emailEscalation(
  sessionId: string,
  mode: Mode,
  bucket: Bucket,
  bucketReason: string,
  transcript: string
) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return false;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  const cfg = MODE_CONFIG[mode];
  const bkt = bucket === 'NONE' ? 'SALES-OPS' : bucket;
  const subject = `[${bkt}] [${cfg.severityMark}] Triage escalation`;
  const token = signToken(sessionId);
  const takeoverUrl = `${siteBaseUrl()}/triage/take-over/${sessionId}?token=${token}`;

  const body = `Bucket: ${bkt}
Lane: ${cfg.label} (${cfg.severityMark})
Urgency: ${cfg.urgency}
Classifier reason: ${bucketReason}

TAKE OVER: ${takeoverUrl}

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
  if (!apiKey)
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    );

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.message || typeof body.message !== 'string' || !body.message.trim())
    return NextResponse.json({ error: 'message required' }, { status: 400 });

  const sb = adminClient();
  let sessionId = body.sessionId;
  let mode: Mode;

  if (!sessionId) {
    if (!body.mode || !(body.mode in MODE_CONFIG))
      return NextResponse.json(
        { error: 'mode required to start session' },
        { status: 400 }
      );
    if (body.mode === 'in_appt' && !body.pledgeConfirmed)
      return NextResponse.json(
        { error: 'In-Appointment pledge must be confirmed' },
        { status: 400 }
      );
    mode = body.mode;
    const { data, error } = await sb
      .from('triage_sessions')
      .insert({
        mode,
        status: 'bot',
        pledge_confirmed: body.pledgeConfirmed === true,
      })
      .select()
      .single();
    if (error || !data)
      return NextResponse.json({ error: 'session create failed' }, { status: 500 });
    sessionId = data.id as string;
  } else {
    const { data: session } = await sb
      .from('triage_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (!session)
      return NextResponse.json({ error: 'session not found' }, { status: 404 });
    if (session.status === 'taken_over')
      return NextResponse.json(
        { error: 'Session taken over by human; rep messages go through realtime only' },
        { status: 409 }
      );
    mode = session.mode as Mode;
  }

  const userMsg = body.message.trim();
  await sb
    .from('triage_messages')
    .insert({ session_id: sessionId, role: 'user', content: userMsg });

  const { data: msgs } = await sb
    .from('triage_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  const history = (msgs ?? []).map((m) => ({
    role: m.role === 'human' ? ('assistant' as const) : (m.role as 'user' | 'assistant'),
    content: m.content,
  }));

  const client = new Anthropic({ apiKey });
  const draftReply = await generateReply(client, history, mode);
  const classifier = await classify(client, userMsg, draftReply, mode, 0);

  let finalReply = draftReply;
  let botRejected = false;
  if (!classifier.isWorkRelated) {
    finalReply = COPY.WORK_REJECTION;
    botRejected = true;
  }

  const { data: sessionRow } = await sb
    .from('triage_sessions')
    .select('attempts')
    .eq('id', sessionId)
    .single();
  const attemptsBefore = sessionRow?.attempts ?? 0;
  const thisCountsAsAttempt =
    !botRejected &&
    (classifier.botCanAnswer === 'confident' ||
      classifier.botCanAnswer === 'unknown');
  const attemptsAfter = thisCountsAsAttempt ? attemptsBefore + 1 : attemptsBefore;

  const escalate =
    !botRejected && shouldEscalate(mode, classifier.botCanAnswer, attemptsAfter);

  await sb
    .from('triage_messages')
    .insert({ session_id: sessionId, role: 'assistant', content: finalReply });

  const cfg = MODE_CONFIG[mode];
  const sessionUpdate: Record<string, unknown> = {
    attempts: attemptsAfter,
    updated_at: new Date().toISOString(),
  };
  if (escalate) {
    sessionUpdate.status = 'escalated';
    sessionUpdate.bucket =
      classifier.bucket === 'NONE' ? 'SALES-OPS' : classifier.bucket;
    sessionUpdate.urgency = cfg.urgency;
  }
  await sb.from('triage_sessions').update(sessionUpdate).eq('id', sessionId);

  let escalated = false;
  if (escalate) {
    const { data: fullMsgs } = await sb
      .from('triage_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    const transcript = (fullMsgs ?? [])
      .map(
        (m) =>
          `${m.role === 'user' ? 'REP' : m.role === 'human' ? 'HUMAN' : 'BOT'}: ${m.content}`
      )
      .join('\n\n');
    try {
      escalated = await emailEscalation(
        sessionId,
        mode,
        classifier.bucket,
        classifier.bucketReason,
        transcript
      );
    } catch (err) {
      console.error('[triage] escalation email failed', err);
    }
  }

  return NextResponse.json({
    sessionId,
    reply: finalReply,
    escalated,
    status: escalate ? 'escalated' : 'bot',
  });
}
