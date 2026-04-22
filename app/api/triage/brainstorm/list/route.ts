import { NextResponse } from 'next/server';
import { adminClient } from '../../../../../lib/triage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const sb = adminClient();
  const [subs, reps] = await Promise.all([
    sb
      .from('brainstorm_submissions')
      .select('*')
      .order('created_at', { ascending: false }),
    sb
      .from('brainstorm_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1),
  ]);
  if (subs.error) {
    return NextResponse.json({ error: subs.error.message }, { status: 500 });
  }
  return NextResponse.json({
    submissions: subs.data ?? [],
    latestReport: reps.data?.[0] ?? null,
  });
}
