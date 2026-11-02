import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { hit, clientKey } from '../../../../lib/sales-ops/rate-limit';

export const dynamic = 'force-dynamic';

// Minimal feedback sink. Writes to Supabase if env is wired, else no-op.
// Beta: unauthed callers from the gated hub POST their unmatched asks here.

const PER_IP_MAX = 20;         // 20 posts per minute per IP
const PER_IP_WINDOW_MS = 60_000;
const MAX_TEXT_LEN = 4000;

export async function POST(req: NextRequest) {
  const store = await cookies();
  if (store.get('sales_ops_auth')?.value !== '1') {
    return Response.json({ ok: false, error: 'not authorized' }, { status: 401 });
  }

  const ip = clientKey(req);
  const limited = hit(`feedback:${ip}`, PER_IP_MAX, PER_IP_WINDOW_MS);
  if (!limited.ok) {
    return Response.json(
      { ok: false, error: 'too many requests' },
      { status: 429, headers: { 'retry-after': String(Math.ceil(limited.retryAfterMs / 1000)) } },
    );
  }

  let body: { text?: string; ts?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'bad json' }, { status: 400 });
  }

  const text = (body.text ?? '').trim();
  if (!text) return Response.json({ ok: false, error: 'empty' }, { status: 400 });
  if (text.length > MAX_TEXT_LEN) {
    return Response.json({ ok: false, error: 'too long' }, { status: 413 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // No Supabase wired yet \u2014 log to server and accept.
    console.log('[sales-ops feedback]', text);
    return Response.json({ ok: true, mode: 'console' });
  }

  try {
    const res = await fetch(`${url}/rest/v1/sales_ops_feedback`, {
      method: 'POST',
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        prefer: 'return=minimal',
      },
      body: JSON.stringify({ user_text: text, intent: null, status: 'new' }),
    });
    if (!res.ok) {
      console.warn('[sales-ops feedback] supabase insert failed', res.status);
      return Response.json({ ok: true, mode: 'console-fallback' });
    }
    return Response.json({ ok: true, mode: 'supabase' });
  } catch (e) {
    console.warn('[sales-ops feedback] supabase error', e);
    return Response.json({ ok: true, mode: 'console-fallback' });
  }
}
