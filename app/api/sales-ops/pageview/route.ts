// Pageview sink. Writes {name, path, ip, user_agent, viewed_at} to Supabase
// when wired, else logs to the server console. Keyed by the sales_ops_auth
// cookie so unauthed clients can't flood the log.

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { hit, clientKey } from '../../../../lib/sales-ops/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PER_IP_MAX = 180;             // 3 views/sec per IP ceiling
const PER_IP_WINDOW_MS = 60_000;
const MAX_PATH_LEN = 300;

export async function POST(req: NextRequest) {
  const store = await cookies();
  if (store.get('sales_ops_auth')?.value !== '1') {
    return Response.json({ ok: false }, { status: 401 });
  }

  const ip = clientKey(req);
  const limited = hit(`pageview:${ip}`, PER_IP_MAX, PER_IP_WINDOW_MS);
  if (!limited.ok) {
    return Response.json({ ok: false }, { status: 429 });
  }

  let body: { path?: string; ts?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  const path = (body.path ?? '').toString().slice(0, MAX_PATH_LEN);
  if (!path || !path.startsWith('/sales-ops')) {
    return Response.json({ ok: false, error: 'bad path' }, { status: 400 });
  }

  // Identity cookie is URI-encoded JSON {name, when}. Decode defensively.
  const identityRaw = store.get('sales_ops_identity')?.value ?? '';
  let name = '(anonymous)';
  if (identityRaw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(identityRaw)) as { name?: string };
      if (parsed.name) name = parsed.name;
    } catch { /* ignore */ }
  }

  const userAgent = req.headers.get('user-agent') ?? '';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log('[sales-ops pageview]', JSON.stringify({ name, path, ip, userAgent }));
    return Response.json({ ok: true, mode: 'console' });
  }

  try {
    const res = await fetch(`${url}/rest/v1/sales_ops_pageviews`, {
      method: 'POST',
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        prefer: 'return=minimal',
      },
      body: JSON.stringify({ name, path, ip, user_agent: userAgent.slice(0, 500) }),
    });
    if (!res.ok) {
      console.warn('[sales-ops pageview] supabase insert failed', res.status);
      return Response.json({ ok: true, mode: 'console-fallback' });
    }
    return Response.json({ ok: true, mode: 'supabase' });
  } catch (e) {
    console.warn('[sales-ops pageview] supabase error', e);
    return Response.json({ ok: true, mode: 'console-fallback' });
  }
}
