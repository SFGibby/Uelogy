import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
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
  type TriageErrorCode,
  type TriageErrorEnvelope,
} from '../../../lib/triage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TRIAGE_DIR = join(process.cwd(), 'app', 'triage');
const KB_PATH = join(TRIAGE_DIR, 'knowledge-base.md');
const DIR_PATH = join(TRIAGE_DIR, 'directory.md');
const BRAIN_DIR = join(TRIAGE_DIR, 'brain');
const BRAIN_SKIP = new Set(['_template.md', 'README.md']);

// Memoize docs per-mode per-serverless-instance. Brain + KB + Directory
// files don't change between cold starts; recomputing on every POST was
// ~50-100ms of wasted disk + concat on warm requests.
const DOCS_CACHE = new Map<Mode, string>();
function loadDocs(mode: Mode = 'prepping'): string {
  const cached = DOCS_CACHE.get(mode);
  if (cached) return cached;
  const kb = safeRead(KB_PATH);
  const dir = safeRead(DIR_PATH);
  // Extra Support lane needs full brain bodies (past resolutions + seen_in
  // dates). Other lanes take the compact slug index to fit Groq free-tier
  // TPM on llama-3.3-70b. Extra Support runs on the larger-TPM model.
  const brain = mode === 'extra_support' ? loadBrainFull() : loadBrain();
  const out = `## Knowledge Base\n${kb}\n\n## Directory\n${dir}\n\n## Brain\n${brain}`;
  DOCS_CACHE.set(mode, out);
  return out;
}

function errorResponse(
  code: TriageErrorCode,
  message: string,
  status: number,
  detail?: string
) {
  const envelope: { error: TriageErrorEnvelope } = {
    error: { code, message, ...(detail ? { detail } : {}) },
  };
  return NextResponse.json(envelope, { status });
}

function loadBrainFull(): string {
  const files = collectBrainFiles(BRAIN_DIR);
  if (files.length === 0) return '(no brain entries yet)';
  return files
    .map((abs) => `### ${relative(TRIAGE_DIR, abs)}\n${safeRead(abs)}`)
    .join('\n\n');
}

function safeRead(p: string): string {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '(file missing)';
  }
}

// Compact index of brain entries — title + slug + seen count only.
// Full entries total ~16k tokens, blowing Groq free-tier TPM. Bot can
// point reps at /triage/faq#<slug> for the detailed resolution.
function loadBrain(): string {
  const files = collectBrainFiles(BRAIN_DIR);
  if (files.length === 0) return '(no brain entries yet)';
  const lines = files.map((abs) => {
    const rel = relative(TRIAGE_DIR, abs);
    const slug = abs.split('/').pop()!.replace(/\.md$/, '');
    const text = safeRead(abs);
    const titleMatch = text.match(/^title:\s*(.+?)\s*$/m);
    const systemsMatch = text.match(/^systems:\s*\[(.*?)\]/m);
    const title = titleMatch ? titleMatch[1] : slug;
    const systems = systemsMatch ? systemsMatch[1] : '';
    return `- [${slug}] ${title}${systems ? ` (${systems})` : ''}  — ${rel}`;
  });
  return `Index of FAQ entries at /triage/faq (each has Symptom / Likely Cause / Resolution / Related). When relevant, point reps at the slug: "/triage/faq#<slug>".\n\n${lines.join('\n')}`;
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

const CHAT_MODEL = 'llama-3.3-70b-versatile';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
// Larger-TPM model for Extra Support lane (full brain ~16K tokens).
const EXTRA_SUPPORT_MODEL = 'openai/gpt-oss-120b';

async function classify(
  client: Groq,
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

  const systemPrompt = `You evaluate a sales-triage exchange.

isWorkRelated: true unless the rep's message is clearly non-work (personal trivia, creative writing, unrelated coding help). If it could plausibly relate to SunPower sales/ops/tools, set true.

botCanAnswer:
  - confident: draft fully answers with facts from the KB.
  - needs_clarification: draft asks a clarifying question because one specific detail is missing.
  - unknown: draft admits it doesn't know or is a placeholder escalation line.

categories: ARRAY of 1-3 departments the issue touches. Pick multiple only when genuinely ambiguous. Available: SALES-OPS, DIRECT-SALES, EPC, PIP, TECH-SUPPORT, ONBOARDING, SALES-ONBOARDING, COMMISSIONS. When unsure, include SALES-OPS so Sam can manually triage.

primaryBucket: single best pick from the categories array (used for the escalation-email subject).

detectedRepName: if the rep introduced themselves in the message ("hey it's Tanner", "this is Marisol", etc.), return the first name; otherwise null. Never guess.

You MUST call the classify function with your answer.`;

  try {
    const response = await client.chat.completions.create({
      model: CHAT_MODEL,
      max_tokens: 400,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'classify',
            description: 'Classify the triage exchange',
            parameters: {
              type: 'object',
              properties: {
                isWorkRelated: { type: 'boolean' },
                botCanAnswer: {
                  type: 'string',
                  enum: ['confident', 'needs_clarification', 'unknown'],
                },
                categories: {
                  type: 'array',
                  items: { type: 'string', enum: ALL_BUCKETS },
                  minItems: 1,
                  maxItems: 4,
                },
                primaryBucket: { type: 'string', enum: ALL_BUCKETS },
                bucketReason: { type: 'string' },
                detectedRepName: { type: ['string', 'null'] },
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
        },
      ],
      tool_choice: { type: 'function', function: { name: 'classify' } },
    });

    const call = response.choices[0]?.message?.tool_calls?.[0];
    if (call && call.function?.name === 'classify' && call.function.arguments) {
      return JSON.parse(call.function.arguments) as ClassifierResult;
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
  client: Groq,
  history: Array<{ role: 'user' | 'assistant'; content: string; image_url?: string | null }>,
  mode: Mode
): Promise<string> {
  const cfg = MODE_CONFIG[mode];
  const system = `You are Helios, the SunPower Triage assistant — a real teammate's voice, not a corporate bot. Warm, plainspoken, occasionally wry. When asked your name, you're Helios.

LANE: ${cfg.label}
${cfg.tone}

UNIVERSAL RULES:
- Never fabricate product facts. If the docs below don't cover it, say so in the mode-appropriate phrasing.
- Never ask more than one question per turn.
- Do NOT ask meta-permission questions like "Would you like me to help with that?", "Do you want guidance?", "Should I try to escalate this for you?", "Want me to reach out to someone?". The rep came to you for help — just help. Only ask a question when you need a specific missing detail to answer (e.g., "Which utility is on the bill?"). If the rep says the problem is locked/stuck/blocked, don't ask if they want to unlock it — give the steps.
- No markdown, no lists, no headers. The ONE exception: you may wrap a short disclaimer phrase in single asterisks to italicize it (e.g. *assuming you've already tried Enerflo support*). Use this sparingly and only for the Enerflo/portal caveat below.
- Address the rep as "you".
- If the rep has attached an image, reference what you see in it directly.

ENERFLO & PORTAL ISSUES:
A lot of questions will be about Enerflo (design tool, proposals, credit, adders) or the customer/installer portals. Those systems have their own support channels, and the rep is expected to try those FIRST before coming to Triage. When a question lands here that is clearly an Enerflo or portal issue:
- Assume they've already hit a wall with Enerflo support or the portal help desk. Don't redirect them back there as your first move.
- ONCE per conversation (and only once — never repeat it on later turns), open your FIRST Enerflo/portal-flavored reply with the short italicized caveat: "*Assuming you've already tried Enerflo support —*" then give your best-effort guidance using the docs. If the caveat already appears earlier in this conversation's assistant messages, DO NOT include it again; just give the guidance straight.
- If the docs don't cover it and the lane rules say escalate, escalate with the normal handoff phrase. Don't loop them back to Enerflo support.

When you genuinely don't have the answer and the lane says escalate, use these exact handoff phrases:
- In Appointment lane: "${COPY.IN_APPT_ESCALATION}"
- About to be lane (after hitting max attempts): "${COPY.ABOUT_TO_ESCALATION}"
- Prepping lane (genuine unknown): "${COPY.PREPPING_UNKNOWN}"
- Router lane (no directory match): "${COPY.ROUTER_UNKNOWN}"

DOCS:
---
${loadDocs(mode)}
---`;

  type ContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } };
  type UserAssistantMsg = {
    role: 'system' | 'user' | 'assistant';
    content: string | ContentPart[];
  };

  const hasImage = history.some((m) => m.role === 'user' && !!m.image_url);

  const messages: UserAssistantMsg[] = [{ role: 'system', content: system }];
  for (const m of history) {
    const text = (m.content || '').trim();
    if (m.role === 'user' && m.image_url) {
      const parts: ContentPart[] = [
        { type: 'image_url', image_url: { url: m.image_url } },
      ];
      if (text) parts.push({ type: 'text', text });
      messages.push({ role: 'user', content: parts });
    } else if (text) {
      messages.push({ role: m.role, content: text });
    }
  }

  const model =
    mode === 'extra_support'
      ? EXTRA_SUPPORT_MODEL
      : hasImage
        ? VISION_MODEL
        : CHAT_MODEL;

  const createCompletion = () =>
    client.chat.completions.create({
      model,
      max_tokens: mode === 'extra_support' ? 800 : 500,
      messages: messages as Parameters<
        typeof client.chat.completions.create
      >[0]['messages'],
    });

  try {
    let response;
    try {
      response = await createCompletion();
    } catch (err) {
      // Retry once on transient 503 ServiceUnavailable from Groq.
      const status = (err as { status?: number })?.status;
      if (status === 503) {
        await new Promise((r) => setTimeout(r, 200));
        response = await createCompletion();
      } else {
        throw err;
      }
    }
    const text = response.choices[0]?.message?.content?.trim();
    if (text && text.length > 0) return text;
    // Empty 2xx from Groq — rare but happens. Don't leak "(no response)".
    return "I didn't catch that — say it again?";
  } catch (err) {
    console.error('[triage] generateReply failed', err);
    return "I hit a snag on my end — try again.";
  }
}

async function generateSummary(
  client: Groq,
  transcript: string
): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: CHAT_MODEL,
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content:
            'Summarize this sales-triage conversation in ONE or TWO short sentences. Focus on what the rep needed and what happened. No preamble.',
        },
        { role: 'user', content: transcript },
      ],
    });
    return response.choices[0]?.message?.content?.trim() ?? '';
  } catch {
    return '';
  }
}

function shouldEscalate(
  mode: Mode,
  botCanAnswer: ClassifierResult['botCanAnswer'],
  attemptsAfterThis: number,
  alreadyEscalated: boolean
): boolean {
  // Extra Support is the ops lane — ops IS the escalation tier.
  if (mode === 'extra_support') return false;
  // Throttle: one escalation email per session. Once the session has a
  // bucket set (i.e. we've already paged), subsequent unresolvable turns
  // don't re-page. Prevents the poll-loop inbox-spam class of bug.
  if (alreadyEscalated) return false;
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
  if (process.env.HELIOS_ESCALATION_MUTE === '1') return false;
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
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    return errorResponse('AUTH', 'GROQ_API_KEY not configured', 500);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON', 400);
  }
  const hasMessage = body.message && typeof body.message === 'string' && body.message.trim();
  const hasImage = body.imageUrl && typeof body.imageUrl === 'string';
  if (!hasMessage && !hasImage)
    return errorResponse('BAD_REQUEST', 'message or imageUrl required', 400);

  const sb = adminClient();
  let sessionId = body.sessionId;
  let mode: Mode;

  if (!sessionId) {
    if (!body.mode || !(body.mode in MODE_CONFIG))
      return errorResponse('BAD_REQUEST', 'mode required to start session', 400);
    if (body.mode === 'in_appt' && !body.pledgeConfirmed)
      return errorResponse(
        'BAD_REQUEST',
        'In-Appointment pledge must be confirmed',
        400
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
    if (error || !data) {
      console.error('[triage] session insert error', error);
      return errorResponse(
        'UNKNOWN',
        'session create failed',
        500,
        error?.message || 'unknown'
      );
    }
    sessionId = data.id as string;
  } else {
    const { data: session } = await sb
      .from('triage_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (!session)
      return errorResponse('SESSION_GONE', 'session not found', 404);
    if (session.status === 'taken_over')
      return errorResponse(
        'SESSION_GONE',
        'Session taken over by human; rep messages go through realtime only',
        409
      );
    if (session.resolved)
      return errorResponse('SESSION_GONE', 'Session already resolved', 409);
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

  const client = new Groq({ apiKey });
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
    .select('attempts, categories, rep_name, bucket')
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

  const alreadyEscalated = !!sessionRow?.bucket;
  const escalate =
    !botRejected &&
    shouldEscalate(mode, classifier.botCanAnswer, attemptsAfter, alreadyEscalated);

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
