import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const ONE_YEAR = 60 * 60 * 24 * 365;

const GATES = {
  tron:   { cookie: 'grid_auth',   env: 'TRON_PASSWORD',   fallback: 'Clue' },
  ledger: { cookie: 'ledger_auth', env: 'LEDGER_PASSWORD', fallback: 'Antha' },
} as const;

type GateName = keyof typeof GATES;

export async function POST(request: NextRequest) {
  let body: { gate?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'bad json' }, { status: 400 });
  }

  const gateName = body.gate as GateName | undefined;
  const password = body.password ?? '';

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

  return Response.json({ ok: true });
}
