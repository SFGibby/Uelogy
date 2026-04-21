import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { adminClient, MODE_CONFIG, Mode } from '../../../../lib/triage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { sessionId?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { sessionId, email } = body;
  if (!sessionId || !email || !email.includes('@'))
    return NextResponse.json({ error: 'sessionId and valid email required' }, { status: 400 });

  const sb = adminClient();
  const [{ data: session }, { data: messages }] = await Promise.all([
    sb.from('triage_sessions').select('*').eq('id', sessionId).single(),
    sb
      .from('triage_messages')
      .select('role, content, image_url, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true }),
  ]);
  if (!session)
    return NextResponse.json({ error: 'session not found' }, { status: 404 });

  const mode = session.mode as Mode;
  const cfg = MODE_CONFIG[mode];
  const transcript = (messages ?? [])
    .map(
      (m) =>
        `${
          m.role === 'user' ? 'REP' : m.role === 'human' ? 'HUMAN' : 'HELIOS'
        }: ${m.content}${m.image_url ? ` [image: ${m.image_url}]` : ''}`
    )
    .join('\n\n');

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass)
    return NextResponse.json({ error: 'mailer not configured' }, { status: 500 });
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  const subject = `[${session.bucket ?? 'SALES-OPS'}] [${cfg.severityMark}] 90s timeout — rep left email`;
  const mailBody = `Rep left an email after no one responded in 90s.

Reply-to: ${email}
Rep (captured): ${session.rep_name ?? 'unknown'}
Lane: ${cfg.label}
Categories: ${(session.categories ?? []).join(', ') || '—'}
Summary: ${session.summary ?? '(none)'}

--- Transcript ---
${transcript}
`;

  await transporter.sendMail({
    from: user,
    to: 'samuel.gibson@sunpower.com',
    replyTo: email,
    subject,
    text: mailBody,
  });

  await sb
    .from('triage_sessions')
    .update({
      updated_at: new Date().toISOString(),
      rep_name: session.rep_name ?? null,
    })
    .eq('id', sessionId);

  return NextResponse.json({ ok: true });
}
