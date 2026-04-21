import { NextRequest, NextResponse } from 'next/server';
import { adminClient, verifyToken } from '../../../../../lib/triage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get('token');
  if (!token || !verifyToken(id, token))
    return NextResponse.json({ error: 'invalid token' }, { status: 401 });

  const sb = adminClient();
  const [{ data: session }, { data: messages }] = await Promise.all([
    sb.from('triage_sessions').select('*').eq('id', id).single(),
    sb
      .from('triage_messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true }),
  ]);
  if (!session)
    return NextResponse.json({ error: 'session not found' }, { status: 404 });

  return NextResponse.json({ session, messages: messages ?? [] });
}
