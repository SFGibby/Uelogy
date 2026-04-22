import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { adminClient } from '../../../../../lib/triage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Submission {
  id: string;
  department: string;
  parent_company: string | null;
  head_name: string | null;
  head_role: string | null;
  purpose: string;
  owns: string;
  does_not_own: string | null;
  top_questions: string;
  systems: string[];
  handoff_partners: string | null;
  gray_areas: string | null;
  contact_sla: string | null;
  created_at: string;
}

function formatSubmission(s: Submission): string {
  return `### ${s.department}${s.parent_company ? ` (${s.parent_company})` : ''}
Head: ${s.head_name ?? '—'}${s.head_role ? `, ${s.head_role}` : ''}

Purpose: ${s.purpose}

Owns:
${s.owns}

Does NOT own (but often asked about):
${s.does_not_own ?? '—'}

Top rep questions + answers:
${s.top_questions}

Systems: ${s.systems.join(', ') || '—'}
Handoff partners: ${s.handoff_partners ?? '—'}
Gray areas: ${s.gray_areas ?? '—'}
Contact / SLA: ${s.contact_sla ?? '—'}`;
}

export async function POST() {
  const sb = adminClient();
  const { data: submissions, error } = await sb
    .from('brainstorm_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!submissions || submissions.length < 2) {
    return NextResponse.json(
      { error: 'need at least 2 submissions to run an overlap report' },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY missing' },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });
  const corpus = submissions
    .map((s) => formatSubmission(s as Submission))
    .join('\n\n---\n\n');

  const system = `You analyze department-scope submissions from a merged-company org (SunPower — an amalgam of Complete Solar, Solaria, Ambia, Sunder, Blue Raven Solar, and others). Your job is to find where departments step on each other's toes, where ownership is ambiguous, and where gaps exist so sales reps get bounced between teams.

Return THREE sections, using this exact structure:

## Overlaps
Pairs or triples of departments that both claim to own the same work, or that would likely be asked the same rep question. For each, name the departments, quote the overlapping scope in <=15 words, and state which one *should* own it with a one-sentence rationale.

## Gaps
Common rep questions that no submitting department owns, or scope items where the handoff chain is unclear. State the rep question or topic, and note who would realistically inherit it given the submissions.

## Recommendations
Concrete "line in the sand" proposals. For each recommendation: the topic, the proposed owner, the proposed escalation partner, and a one-sentence reason. Keep each recommendation to 3-4 lines.

Rules:
- Be specific. Quote directly from submissions where possible.
- Don't invent departments that didn't submit.
- Flag parent-company origin when it matters (e.g. Blue Raven vs. Complete Solar often have parallel versions of the same function).
- No fluff preamble, no closing summary — just the three sections.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 3000,
    system,
    messages: [
      {
        role: 'user',
        content: `Analyze these ${submissions.length} department submissions:\n\n${corpus}`,
      },
    ],
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = textBlock && textBlock.type === 'text' ? textBlock.text : '';

  const overlaps = extractSection(raw, 'Overlaps');
  const gaps = extractSection(raw, 'Gaps');
  const recs = extractSection(raw, 'Recommendations');

  const { data: saved, error: saveErr } = await sb
    .from('brainstorm_reports')
    .insert({
      submission_count: submissions.length,
      overlaps_markdown: overlaps,
      gaps_markdown: gaps,
      recommendations_markdown: recs,
      raw_model_output: raw,
    })
    .select('*')
    .single();

  if (saveErr) {
    return NextResponse.json({ error: saveErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, report: saved });
}

function extractSection(md: string, heading: string): string {
  const re = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, 'i');
  const m = md.match(re);
  return m ? m[1].trim() : '';
}
