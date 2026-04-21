import { NextRequest, NextResponse } from 'next/server';
import { adminClient, verifyToken } from '../../../../lib/triage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  sessionId: string;
  token?: string;
  action: 'take_over' | 'reply' | 'close' | 'mark_resolved' | 'rep_resolved';
  content?: string;
  heliosSolved?: boolean;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { sessionId, token, action, content, heliosSolved } = body;
  if (!sessionId)
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  // Rep can mark their own session resolved without a token; all other actions need the HMAC.
  const isRepAction = action === 'rep_resolved';
  if (!isRepAction) {
    if (!token || !verifyToken(sessionId, token))
      return NextResponse.json({ error: 'invalid token' }, { status: 401 });
  }

  const sb = adminClient();

  if (action === 'take_over') {
    const { error } = await sb
      .from('triage_sessions')
      .update({ status: 'taken_over', updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await sb.from('triage_messages').insert({
      session_id: sessionId,
      role: 'human',
      content: 'A human just joined. You are now talking to Sam.',
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'reply') {
    if (!content || !content.trim())
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    await sb.from('triage_messages').insert({
      session_id: sessionId,
      role: 'human',
      content: content.trim(),
    });
    await sb
      .from('triage_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    return NextResponse.json({ ok: true });
  }

  if (action === 'close') {
    await sb
      .from('triage_sessions')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    return NextResponse.json({ ok: true });
  }

  if (action === 'mark_resolved' || action === 'rep_resolved') {
    const { data: session } = await sb
      .from('triage_sessions')
      .select('status')
      .eq('id', sessionId)
      .single();
    const wasBotOnly =
      session?.status === 'bot' || session?.status === 'escalated';
    const solved =
      typeof heliosSolved === 'boolean' ? heliosSolved : wasBotOnly;
    await sb
      .from('triage_sessions')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        helios_solved: solved,
        status: 'closed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
