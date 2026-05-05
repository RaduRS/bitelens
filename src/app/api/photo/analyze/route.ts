import { NextResponse } from 'next/server';
import { analyzePhoto } from '@/lib/ai/vision';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('photo');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No photo provided.' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large (max 8 MB).' }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const product = await analyzePhoto({
      base64: bytes.toString('base64'),
      mimeType: file.type,
    });
    return NextResponse.json({ product });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to analyze photo.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
