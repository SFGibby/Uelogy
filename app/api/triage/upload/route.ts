import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { adminClient } from '../../../../lib/triage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'triage-uploads';
const MAX_BYTES = 20 * 1024 * 1024;
// Formats Claude vision supports natively — everything else is converted.
const CLAUDE_SUPPORTED = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File))
    return NextResponse.json({ error: 'file missing' }, { status: 400 });

  const declaredType = file.type || '';
  const looksLikeImage =
    declaredType.startsWith('image/') ||
    /\.(heic|heif|tiff?|bmp|svg|avif|jp2|jxr|jfif|dng|raw|cr2|nef|arw)$/i.test(
      file.name || ''
    );
  if (!looksLikeImage)
    return NextResponse.json(
      { error: 'must be an image file' },
      { status: 400 }
    );
  if (file.size > MAX_BYTES)
    return NextResponse.json(
      { error: 'file too large (20 MB max)' },
      { status: 400 }
    );

  const originalBytes = Buffer.from(await file.arrayBuffer());

  let uploadBytes: Buffer = originalBytes;
  let uploadType = declaredType;
  let uploadExt = (file.name.split('.').pop() || '').toLowerCase();

  const needsConvert =
    !declaredType || !CLAUDE_SUPPORTED.has(declaredType);

  if (needsConvert) {
    try {
      const converted = await sharp(originalBytes, { failOn: 'none' })
        .rotate()
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      uploadBytes = converted;
      uploadType = 'image/jpeg';
      uploadExt = 'jpg';
    } catch (err) {
      return NextResponse.json(
        {
          error: `unable to read image: ${
            err instanceof Error ? err.message : 'unknown'
          }`,
        },
        { status: 400 }
      );
    }
  } else {
    // Still strip EXIF / downscale overly large supported images.
    try {
      uploadBytes = await sharp(originalBytes, { failOn: 'none' })
        .rotate()
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    } catch {
      uploadBytes = originalBytes;
    }
  }

  const sb = adminClient();
  await sb.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${uploadExt || 'jpg'}`;
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, uploadBytes, { contentType: uploadType, upsert: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const {
    data: { publicUrl },
  } = sb.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: publicUrl, contentType: uploadType });
}
