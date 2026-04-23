import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'node:crypto';

export type Mode = 'in_appt' | 'about_to' | 'prepping' | 'router' | 'extra_support';
export type Status = 'bot' | 'escalated' | 'taken_over' | 'closed';
export type MessageRole = 'user' | 'assistant' | 'human';
export type Bucket =
  | 'SALES-OPS'
  | 'DIRECT-SALES'
  | 'EPC'
  | 'PIP'
  | 'TECH-SUPPORT'
  | 'ONBOARDING'
  | 'SALES-ONBOARDING'
  | 'COMMISSIONS'
  | 'NONE';
export type Urgency = 'URGENT' | 'NORMAL' | 'LOW';

export interface Session {
  id: string;
  mode: Mode;
  status: Status;
  bucket: Bucket | null;
  urgency: Urgency | null;
  attempts: number;
  pledge_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

const SUPABASE_URL = 'https://zusoxekerqrvdlctbkcc.supabase.co';

export function adminClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing');
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false },
  });
}

export const MODE_CONFIG: Record<
  Mode,
  {
    label: string;
    urgency: Urgency;
    maxAttempts: number | null;
    severityMark: string;
    tone: string;
  }
> = {
  in_appt: {
    label: 'In Appointment',
    urgency: 'URGENT',
    maxAttempts: 1,
    severityMark: '!!!',
    tone: `You are in a rep's ear RIGHT NOW. A customer is watching them.
- Answer in ONE sentence. Plain, confident, usable out loud.
- Zero preamble. No "great question". No markdown. No lists.
- If you don't know from the knowledge base, DO NOT ask for more context. Reply exactly: "I don't have this one locked in — I'm looping Sam in right now, keep the conversation going."
- Never speculate about product facts.`,
  },
  about_to: {
    label: 'About to be in an Appointment',
    urgency: 'NORMAL',
    maxAttempts: 2,
    severityMark: '!!',
    tone: `The rep is prepping — minutes away from the door.
- Give a tight 2-4 sentence brief.
- If the question is answerable from the knowledge base, answer it.
- If you need one specific detail to answer (product line, customer type, state), ask ONE clarifying question.
- You get at most two answer attempts total. If you still can't fully resolve on the second pass, say: "I can't get you a confident answer on this — handing off to Sam."
- Friendly-direct colleague tone.`,
  },
  prepping: {
    label: 'Prepping for an Appointment',
    urgency: 'LOW',
    maxAttempts: null,
    severityMark: '!',
    tone: `You are the most patient and analytical lane. The rep has time.
- Give thorough, well-reasoned answers. Walk through scenarios, objection rehearsal, compare product lines.
- Ask clarifying questions when useful (still one at a time, never a list).
- Only escalate when the rep explicitly asks for a human OR you genuinely don't have the answer after trying.
- Use a senior-rep coaching tone.`,
  },
  router: {
    label: 'Help, I need somebody',
    urgency: 'LOW',
    maxAttempts: 1,
    severityMark: '!',
    tone: `You are a wayfinder, not a product expert. The rep is asking who owns what or where to find something.
- Use the Directory section of the knowledge base to answer "who owns / where do I find / who do I talk to" questions.
- Ask one narrowing question if the request is vague.
- If the directory has the answer, give it. If it doesn't, say: "I don't have the right contact — handing you to Sam to route."
- Do not attempt product-technical answers in this lane.`,
  },
  extra_support: {
    label: 'Extra Support',
    urgency: 'LOW',
    maxAttempts: null,
    severityMark: '·',
    tone: `You are supporting ops / internal support staff, not a rep. The user is triaging an incoming rep request and wants pattern-match help from prior cases.
- Lead with the closest matching brain entry (or two). Cite the slug and the dates it was seen: "Closest match: goodleap-tpo-ca-failures, seen 2025-11-18, 2025-12-12, 2026-01-17."
- Summarize the resolution steps that worked previously. Quote relevant specifics when the transcript captured them.
- If two or more entries are close, compare them and flag how to tell which applies.
- If nothing in the brain matches well, say so plainly — don't fabricate. Suggest tags/keywords to search or ask one clarifying detail.
- Ops-colleague register: direct, analytical, no hand-holding, markdown-free prose, but you may use short inline lists when comparing cases. No escalation language — ops IS the escalation tier.`,
  },
};

const WORK_REJECTION =
  "That's weird, how does this apply to your work for the Org?";

const IN_APPT_ESCALATION =
  "I don't have this one locked in — I'm looping Sam in right now, keep the conversation going.";

const ABOUT_TO_ESCALATION =
  "I can't get you a confident answer on this — handing off to Sam.";

const PREPPING_UNKNOWN =
  "Honest answer: I don't have this. Handing you to Sam so you get it right.";

const ROUTER_UNKNOWN =
  "I don't have the right contact in my directory — handing you to Sam to route.";

export const COPY = {
  WORK_REJECTION,
  IN_APPT_ESCALATION,
  ABOUT_TO_ESCALATION,
  PREPPING_UNKNOWN,
  ROUTER_UNKNOWN,
  IN_APPT_PLEDGE:
    'Are you actually in the home with the client? If not and we find out all your future requests will be de-prioritized.',
};

export function signToken(sessionId: string): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error('CRON_SECRET missing');
  return createHmac('sha256', secret).update(sessionId).digest('hex');
}

export function verifyToken(sessionId: string, token: string): boolean {
  const expected = signToken(sessionId);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(token, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function siteBaseUrl(): string {
  const env = process.env.SITE_URL || process.env.VERCEL_URL;
  if (env) {
    return env.startsWith('http') ? env : `https://${env}`;
  }
  return 'https://uelogy.vercel.app';
}
