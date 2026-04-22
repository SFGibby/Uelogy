import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '../../../../../lib/triage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  department?: string;
  parentCompany?: string;
  headName?: string;
  headRole?: string;
  purpose?: string;
  owns?: string;
  doesNotOwn?: string;
  topQuestions?: string;
  systems?: string[];
  handoffPartners?: string;
  grayAreas?: string;
  contactSla?: string;
  submittedByEmail?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const department = body.department?.trim();
  const purpose = body.purpose?.trim();
  const owns = body.owns?.trim();
  const topQuestions = body.topQuestions?.trim();
  if (!department || !purpose || !owns || !topQuestions) {
    return NextResponse.json(
      { error: 'department, purpose, owns, and topQuestions are required' },
      { status: 400 }
    );
  }

  const sb = adminClient();
  const { data, error } = await sb
    .from('brainstorm_submissions')
    .insert({
      department,
      parent_company: body.parentCompany?.trim() || null,
      head_name: body.headName?.trim() || null,
      head_role: body.headRole?.trim() || null,
      purpose,
      owns,
      does_not_own: body.doesNotOwn?.trim() || null,
      top_questions: topQuestions,
      systems: Array.isArray(body.systems) ? body.systems : [],
      handoff_partners: body.handoffPartners?.trim() || null,
      gray_areas: body.grayAreas?.trim() || null,
      contact_sla: body.contactSla?.trim() || null,
      submitted_by_email: body.submittedByEmail?.trim() || null,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
