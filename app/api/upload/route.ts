import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'collection-images';

export async function POST(req: NextRequest) {
  const admin = createClient(
    'https://zusoxekerqrvdlctbkcc.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Create bucket if it doesn't exist yet (ignore "already exists" errors)
    await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {});

    const bytes = await file.arrayBuffer();
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
