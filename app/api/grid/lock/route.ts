import { cookies } from 'next/headers';

export async function POST() {
  const store = await cookies();
  store.set({ name: 'flynns_auth', value: '', path: '/', maxAge: 0 });
  store.set({ name: 'grid_auth',   value: '', path: '/', maxAge: 0 });
  return Response.json({ ok: true });
}
