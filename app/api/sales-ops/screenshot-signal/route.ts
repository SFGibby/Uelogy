// Silent sink for best-effort screenshot proxies collected client-side by
// components/sales-ops/ScreenshotSignals.tsx. Writes to Supabase when
// configured, else to the server console. Rate-limited to protect against
// a bug in the client flooding us.

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { hit, clientKey } from '../../../../lib/sales-ops/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_SIGNALS = new Set([
  'print_screen_key',
  'quick_tab_switch',
  'focus_return_fast',
  'devtools_open',
  'image_right_click',
  'copy_image_clipboard',
]);

const PER_IP_MAX = 120;             // 2 signals/sec per IP ceiling
const PER_IP_WINDOW_MS = 60_000;
const MAX_PATH_LEN = 300;
const MAX_META_BYTES = 2_000;

export async function POST(req: NextRequest) {
  const store = await cookies();
  if (store.get('sales_ops_auth')?.value !== '1') {
    return Response.json({ ok: false }, { status: 401 });
  }

  const ip = clientKey(req);
  const limited = hit(`sig:${ip}`, PER_IP_MAX, PER_IP_WINDOW_MS);
  if (!limited.ok) {
    return Response.json({ ok: false }, { status: 429 });
  }

  let body: { path?: string; signal_type?: string; meta?: unknown; ts?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  const path = (body.path ?? '').toString().slice(0, MAX_PATH_LEN);
  const signalType = (body.signal_type ?? '').toString();
  if (!path.startsWith('/sales-ops') || !ALLOWED_SIGNALS.has(signalType)) {
    return Response.json({ ok: false }, { status: 400 });
  }
  let metaString: string;
  try {
    metaString = JSON.stringify(body.meta ?? {}).slice(0, MAX_META_BYTES);
  } catch {
    metaString = '{}';
  }

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
    console.log('[sales-ops signal]', JSON.stringify({ name, path, signalType, ip, meta: metaString }));
    return Response.json({ ok: true, mode: 'console' });
  }

  try {
    const res = await fetch(`${url}/rest/v1/sales_ops_screenshot_signals`, {
      method: 'POST',
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        prefer: 'return=minimal',
      },
      body: JSON.stringify({
        name,
        path,
        signal_type: signalType,
        meta: metaString,
        ip,
        user_agent: userAgent.slice(0, 500),
      }),
    });
    if (!res.ok) {
      console.warn('[sales-ops signal] supabase insert failed', res.status);
      return Response.json({ ok: true, mode: 'console-fallback' });
    }
    return Response.json({ ok: true, mode: 'supabase' });
  } catch (e) {
    console.warn('[sales-ops signal] supabase error', e);
    return Response.json({ ok: true, mode: 'console-fallback' });
  }
}
