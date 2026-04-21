import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/triage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'triage-uploads';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File))
    return NextResponse.json({ error: 'file missing' }, { status: 400 });
  if (!ALLOWED.has(file.type))
    return NextResponse.json({ error: 'unsupported type' }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: 'file too large (10 MB max)' }, { status: 400 });

  const sb = adminClient();
  await sb.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await file.arrayBuffer();
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const {
    data: { publicUrl },
  } = sb.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: publicUrl });
}
