import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const ONE_YEAR = 60 * 60 * 24 * 365;

const GATES = {
  tron:       { cookie: 'grid_auth',      env: 'TRON_PASSWORD',       fallback: 'Clue' },
  ledger:     { cookie: 'ledger_auth',    env: 'LEDGER_PASSWORD',     fallback: 'Antha' },
  sales_ops:  { cookie: 'sales_ops_auth', env: 'SALES_OPS_PASSWORD',  fallback: 'Kerstin' },
} as const;

type GateName = keyof typeof GATES;

// Keep identity text short, printable, single-line. Prevents the cookie from
// turning into a vector for XSS or oversized headers.
function sanitizeName(input: string): string {
  return input
    .replace(/[\u0000-\u001f\u007f]/g, '')  // control chars
    .replace(/[<>"'`\\]/g, '')               // common HTML/attribute breakers
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

export async function POST(request: NextRequest) {
  let body: { gate?: string; password?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'bad json' }, { status: 400 });
  }

  const gateName = body.gate as GateName | undefined;
  const password = body.password ?? '';
  const name = sanitizeName(body.name ?? '');

  if (!gateName || !(gateName in GATES)) {
    return Response.json({ ok: false, error: 'unknown gate' }, { status: 400 });
  }

  const gate = GATES[gateName];
  const expected = process.env[gate.env] ?? gate.fallback;

  if (password !== expected) {
    return Response.json({ ok: false, error: 'wrong password' }, { status: 401 });
  }

  const store = await cookies();
  store.set({
    name: gate.cookie,
    value: '1',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR,
  });

  // Only the Sales Ops gate attaches a visible identity cookie — it's used
  // by the watermark + pageview beacon. Readable from JS, lax same-site so
  // same-origin fetches still see it.
  if (gateName === 'sales_ops' && name) {
    const identity = JSON.stringify({ name, when: new Date().toISOString() });
    store.set({
      name: 'sales_ops_identity',
      value: encodeURIComponent(identity),
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ONE_YEAR,
    });
  }

  return Response.json({ ok: true });
}
