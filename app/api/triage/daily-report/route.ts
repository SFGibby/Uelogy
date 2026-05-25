import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { adminClient, MODE_CONFIG, Mode } from '../../../../lib/triage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SessionRow {
  id: string;
  mode: Mode;
  status: string;
  bucket: string | null;
  urgency: string | null;
  categories: string[] | null;
  attempts: number;
  resolved: boolean;
  resolved_at: string | null;
  rep_name: string | null;
  summary: string | null;
  helios_solved: boolean | null;
  created_at: string;
  updated_at: string;
}

function severityMark(mode: Mode): string {
  return MODE_CONFIG[mode]?.severityMark ?? '·';
}

function laneLabel(mode: Mode): string {
  return MODE_CONFIG[mode]?.label ?? mode;
}

async function runReport() {
  const sb = adminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: rows, error } = await sb
    .from('triage_sessions')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const sessions = (rows as SessionRow[]) ?? [];

  const total = sessions.length;
  const resolved = sessions.filter((s) => s.resolved).length;
  const heliosSolved = sessions.filter((s) => s.helios_solved === true).length;
  const escalated = sessions.filter((s) => s.status === 'escalated' || s.status === 'taken_over').length;

  // No chats in the last 24h → don't bother emailing.
  if (total === 0) return { total, resolved, heliosSolved, escalated, skipped: true };

  const lines: string[] = [];
  lines.push(`SunPower Triage — last 24 h`);
  lines.push(`Total chats: ${total}`);
  lines.push(`Resolved: ${resolved}   ·   Helios solo-solved: ${heliosSolved}   ·   Escalated/taken over: ${escalated}`);
  lines.push('');
  lines.push('—'.repeat(40));

  for (const s of sessions) {
    lines.push('');
    lines.push(
      `[${severityMark(s.mode)}] ${laneLabel(s.mode)}   ·   ${new Date(
        s.created_at
      ).toLocaleString('en-US', { timeZone: 'America/Denver' })}`
    );
    lines.push(`Rep: ${s.rep_name ?? 'unknown'}`);
    lines.push(
      `Status: ${s.status}${s.resolved ? '  · RESOLVED' : ''}${
        s.helios_solved === true ? '  · Helios solo-solved' : ''
      }`
    );
    lines.push(
      `Categories: ${(s.categories && s.categories.length ? s.categories : ['—']).join(', ')}`
    );
    lines.push(`Summary: ${s.summary?.trim() || '(no summary generated)'}`);
  }

  const body = lines.join('\n');

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('gmail creds missing');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  await transporter.sendMail({
    from: user,
    to: 'samuel.gibson@sunpower.com',
    subject: `[TRIAGE] Daily report — ${total} chats · ${escalated} escalated`,
    text: body,
  });
  return { total, resolved, heliosSolved, escalated };
}

function authorized(req: NextRequest): boolean {
  if (req.headers.get('x-vercel-cron') === '1') return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req))
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const result = await runReport();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  }
}
