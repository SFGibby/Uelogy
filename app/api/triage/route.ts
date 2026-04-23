import { NextRequest, NextResponse } from 'next/server';
import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type Part,
} from '@google/generative-ai';
import nodemailer from 'nodemailer';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
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

const TRIAGE_DIR = join(process.cwd(), 'app', 'triage');
const KB_PATH = join(TRIAGE_DIR, 'knowledge-base.md');
const DIR_PATH = join(TRIAGE_DIR, 'directory.md');
const BRAIN_DIR = join(TRIAGE_DIR, 'brain');
const BRAIN_SKIP = new Set(['_template.md', 'README.md']);

function loadDocs(): string {
  const kb = safeRead(KB_PATH);
  const dir = safeRead(DIR_PATH);
  const brain = loadBrain();
  return `## Knowledge Base\n${kb}\n\n## Directory\n${dir}\n\n## Brain\n${brain}`;
}

function safeRead(p: string): string {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '(file missing)';
  }
}

function loadBrain(): string {
  const files = collectBrainFiles(BRAIN_DIR);
  if (files.length === 0) return '(no brain entries yet)';
  return files
    .map((abs) => {
      const rel = relative(TRIAGE_DIR, abs);
      return `### ${rel}\n${safeRead(abs)}`;
    })
    .join('\n\n');
}

function collectBrainFiles(root: string): string[] {
  const out: string[] = [];
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const abs = join(root, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectBrainFiles(abs));
    } else if (entry.isFile() && entry.name.endsWith('.md') && !BRAIN_SKIP.has(entry.name)) {
      out.push(abs);
    }
  }
  return out.sort();
}

interface RequestBody {
  sessionId?: string;
  mode?: Mode;
  pledgeConfirmed?: boolean;
  message: string;
  imageUrl?: string;
}

interface ClassifierResult {
  isWorkRelated: boolean;
  botCanAnswer: 'confident' | 'needs_clarification' | 'unknown';
  categories: Bucket[];
  primaryBucket: Bucket;
  bucketReason: string;
  detectedRepName?: string | null;
}

const ALL_BUCKETS: Bucket[] = [
  'SALES-OPS',
  'DIRECT-SALES',
  'EPC',
  'PIP',
  'TECH-SUPPORT',
  'ONBOARDING',
  'SALES-ONBOARDING',
  'COMMISSIONS',
];

const MODEL_ID = 'gemini-2.0-flash';

async function fetchImagePart(url: string): Promise<Part | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await res.arrayBuffer());
    return { inlineData: { mimeType, data: buf.toString('base64') } };
  } catch {
    return null;
  }
}

async function classify(
  client: GoogleGenerativeAI,
  latestUserMessage: string,
  draftReply: string,
  mode: Mode
): Promise<ClassifierResult> {
  const prompt = `MODE: ${MODE_CONFIG[mode].label}

REP'S LATEST MESSAGE:
${latestUserMessage}

BOT'S DRAFT REPLY:
${draftReply}

Classify.`;

  const systemInstruction = `You evaluate a sales-triage exchange.

isWorkRelated: true unless the rep's message is clearly non-work (personal trivia, creative writing, unrelated coding help). If it could plausibly relate to SunPower sales/ops/tools, set true.

botCanAnswer:
  - confident: draft fully answers with facts from the KB.
  - needs_clarification: draft asks a clarifying question because one specific detail is missing.
  - unknown: draft admits it doesn't know or is a placeholder escalation line.

categories: ARRAY of 1-3 departments the issue touches. Pick multiple only when genuinely ambiguous. Available: SALES-OPS, DIRECT-SALES, EPC, PIP, TECH-SUPPORT, ONBOARDING, SALES-ONBOARDING, COMMISSIONS. When unsure, include SALES-OPS so Sam can manually triage.

primaryBucket: single best pick from the categories array (used for the escalation-email subject).

detectedRepName: if the rep introduced themselves in the message ("hey it's Tanner", "this is Marisol", etc.), return the first name; otherwise null. Never guess.

You MUST call the classify function with your answer.`;

  const model = client.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction,
    tools: [
      {
        functionDeclarations: [
          {
            name: 'classify',
            description: 'Classify the triage exchange',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                isWorkRelated: { type: SchemaType.BOOLEAN },
                botCanAnswer: {
                  type: SchemaType.STRING,
                  format: 'enum',
                  enum: ['confident', 'needs_clarification', 'unknown'],
                },
                categories: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.STRING,
                    format: 'enum',
                    enum: ALL_BUCKETS as string[],
                  },
                },
                primaryBucket: {
                  type: SchemaType.STRING,
                  format: 'enum',
                  enum: ALL_BUCKETS as string[],
                },
                bucketReason: { type: SchemaType.STRING },
                detectedRepName: { type: SchemaType.STRING, nullable: true },
              },
              required: [
                'isWorkRelated',
                'botCanAnswer',
                'categories',
                'primaryBucket',
                'bucketReason',
              ],
            },
          },
        ],
      },
    ],
    toolConfig: {
      functionCallingConfig: {
        mode: 'ANY' as never,
        allowedFunctionNames: ['classify'],
      },
    },
  });

  try {
    const result = await model.generateContent(prompt);
    const calls = result.response.functionCalls();
    const call = calls && calls[0];
    if (call && call.name === 'classify' && call.args) {
      return call.args as unknown as ClassifierResult;
    }
  } catch (err) {
    console.error('[triage] classify failed', err);
  }
  return {
    isWorkRelated: true,
    botCanAnswer: 'unknown',
    categories: ['SALES-OPS'],
    primaryBucket: 'SALES-OPS',
    bucketReason: 'classifier fallback',
  };
}

async function generateReply(
  client: GoogleGenerativeAI,
  history: Array<{ role: 'user' | 'assistant'; content: string; image_url?: string | null }>,
  mode: Mode
): Promise<string> {
  const cfg = MODE_CONFIG[mode];
  const systemInstruction = `You are Helios, the SunPower Triage assistant — a real teammate's voice, not a corporate bot. Warm, plainspoken, occasionally wry. When asked your name, you're Helios.

LANE: ${cfg.label}
${cfg.tone}

UNIVERSAL RULES:
- Never fabricate product facts. If the docs below don't cover it, say so in the mode-appropriate phrasing.
- Never ask more than one question per turn.
- No markdown, no lists, no headers. The ONE exception: you may wrap a short disclaimer phrase in single asterisks to italicize it (e.g. *assuming you've already tried Enerflo support*). Use this sparingly and only for the Enerflo/portal caveat below.
- Address the rep as "you".
- If the rep has attached an image, reference what you see in it directly.

ENERFLO & PORTAL ISSUES:
A lot of questions will be about Enerflo (design tool, proposals, credit, adders) or the customer/installer portals. Those systems have their own support channels, and the rep is expected to try those FIRST before coming to Triage. When a question lands here that is clearly an Enerflo or portal issue:
- Assume they've already hit a wall with Enerflo support or the portal help desk. Don't redirect them back there as your first move.
- Open the answer (or a turn where you're about to give guidance) with a short italicized caveat — e.g. "*Assuming you've already tried Enerflo support and it didn't unblock you —*" — then give your best-effort guidance using the docs.
- If the docs don't cover it and the lane rules say escalate, escalate with the normal handoff phrase. Don't loop them back to Enerflo support.

When you genuinely don't have the answer and the lane says escalate, use these exact handoff phrases:
- In Appointment lane: "${COPY.IN_APPT_ESCALATION}"
- About to be lane (after hitting max attempts): "${COPY.ABOUT_TO_ESCALATION}"
- Prepping lane (genuine unknown): "${COPY.PREPPING_UNKNOWN}"
- Router lane (no directory match): "${COPY.ROUTER_UNKNOWN}"

DOCS:
---
${loadDocs()}
---`;

  const contents: Content[] = [];
  for (const m of history) {
    const parts: Part[] = [];
    if (m.role === 'user' && m.image_url) {
      const img = await fetchImagePart(m.image_url);
      if (img) parts.push(img);
    }
    if (m.content && m.content.trim()) {
      parts.push({ text: m.content });
    }
    if (parts.length === 0) continue;
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts,
    });
  }

  const model = client.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction,
    generationConfig: { maxOutputTokens: 500 },
  });

  try {
    const result = await model.generateContent({ contents });
    const text = result.response.text();
    return text && text.trim() ? text : '(no response)';
  } catch (err) {
    console.error('[triage] generateReply failed', err);
    return '(no response)';
  }
}

async function generateSummary(
  client: GoogleGenerativeAI,
  transcript: string
): Promise<string> {
  try {
    const model = client.getGenerativeModel({
      model: MODEL_ID,
      systemInstruction:
        'Summarize this sales-triage conversation in ONE or TWO short sentences. Focus on what the rep needed and what happened. No preamble.',
      generationConfig: { maxOutputTokens: 120 },
    });
    const result = await model.generateContent(transcript);
    return result.response.text().trim();
  } catch {
    return '';
  }
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
  categories: Bucket[],
  bucketReason: string,
  transcript: string,
  repName: string | null
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
  const repTag = repName ? ` — ${repName}` : '';
  const subject = `[${bkt}] [${cfg.severityMark}] Triage escalation${repTag}`;
  const token = signToken(sessionId);
  const takeoverUrl = `${siteBaseUrl()}/triage/take-over/${sessionId}?token=${token}`;

  const body = `Bucket: ${bkt}
Categories: ${categories.join(', ')}
Lane: ${cfg.label} (${cfg.severityMark})
Urgency: ${cfg.urgency}
Rep: ${repName ?? 'unknown'}
Classifier reason: ${bucketReason}

TAKE OVER: ${takeoverUrl}

--- Transcript ---
${transcript}
`;
  await transporter.sendMail({ from: user, to: 'samuel.gibson@sunpower.com', subject, text: body });
  return true;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { error: 'GOOGLE_API_KEY not configured' },
      { status: 500 }
    );

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const hasMessage = body.message && typeof body.message === 'string' && body.message.trim();
  const hasImage = body.imageUrl && typeof body.imageUrl === 'string';
  if (!hasMessage && !hasImage)
    return NextResponse.json({ error: 'message or imageUrl required' }, { status: 400 });

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
    if (session.resolved)
      return NextResponse.json(
        { error: 'Session already resolved' },
        { status: 409 }
      );
    mode = session.mode as Mode;
  }

  const userMsg = (body.message || '').trim();
  const imageUrl = body.imageUrl || null;
  await sb.from('triage_messages').insert({
    session_id: sessionId,
    role: 'user',
    content: userMsg,
    image_url: imageUrl,
  });

  const { data: msgs } = await sb
    .from('triage_messages')
    .select('role, content, image_url')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  const history = (msgs ?? []).map((m) => ({
    role: m.role === 'human' ? ('assistant' as const) : (m.role as 'user' | 'assistant'),
    content: m.content,
    image_url: m.image_url,
  }));

  const client = new GoogleGenerativeAI(apiKey);
  const effectiveMessageForClassifier = userMsg || '[image uploaded]';
  const draftReply = await generateReply(client, history, mode);
  const classifier = await classify(
    client,
    effectiveMessageForClassifier,
    draftReply,
    mode
  );

  let finalReply = draftReply;
  let botRejected = false;
  if (!classifier.isWorkRelated) {
    finalReply = COPY.WORK_REJECTION;
    botRejected = true;
  }

  const { data: sessionRow } = await sb
    .from('triage_sessions')
    .select('attempts, categories, rep_name')
    .eq('id', sessionId)
    .single();
  const attemptsBefore = sessionRow?.attempts ?? 0;
  const thisCountsAsAttempt =
    !botRejected &&
    (classifier.botCanAnswer === 'confident' ||
      classifier.botCanAnswer === 'unknown');
  const attemptsAfter = thisCountsAsAttempt ? attemptsBefore + 1 : attemptsBefore;

  const existingCategories: Bucket[] = Array.isArray(sessionRow?.categories)
    ? (sessionRow!.categories as Bucket[])
    : [];
  const mergedCategories = Array.from(
    new Set<Bucket>([...existingCategories, ...classifier.categories])
  );

  const escalate =
    !botRejected && shouldEscalate(mode, classifier.botCanAnswer, attemptsAfter);

  await sb.from('triage_messages').insert({
    session_id: sessionId,
    role: 'assistant',
    content: finalReply,
  });

  const cfg = MODE_CONFIG[mode];
  const sessionUpdate: Record<string, unknown> = {
    attempts: attemptsAfter,
    categories: mergedCategories,
    updated_at: new Date().toISOString(),
  };
  if (classifier.detectedRepName && !sessionRow?.rep_name) {
    sessionUpdate.rep_name = classifier.detectedRepName;
  }
  if (escalate) {
    sessionUpdate.status = 'escalated';
    sessionUpdate.bucket = classifier.primaryBucket;
    sessionUpdate.urgency = cfg.urgency;
  }
  await sb.from('triage_sessions').update(sessionUpdate).eq('id', sessionId);

  let escalated = false;
  if (escalate) {
    const { data: fullMsgs } = await sb
      .from('triage_messages')
      .select('role, content, image_url')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    const transcript = (fullMsgs ?? [])
      .map(
        (m) =>
          `${m.role === 'user' ? 'REP' : m.role === 'human' ? 'HUMAN' : 'HELIOS'}: ${m.content}${
            m.image_url ? ` [image: ${m.image_url}]` : ''
          }`
      )
      .join('\n\n');
    try {
      escalated = await emailEscalation(
        sessionId,
        mode,
        classifier.primaryBucket,
        mergedCategories,
        classifier.bucketReason,
        transcript,
        classifier.detectedRepName || sessionRow?.rep_name || null
      );
      const summary = await generateSummary(client, transcript);
      if (summary) {
        await sb.from('triage_sessions').update({ summary }).eq('id', sessionId);
      }
    } catch (err) {
      console.error('[triage] escalation email failed', err);
    }
  }

  return NextResponse.json({
    sessionId,
    reply: finalReply,
    escalated,
    categories: mergedCategories,
    status: escalate ? 'escalated' : 'bot',
  });
}
