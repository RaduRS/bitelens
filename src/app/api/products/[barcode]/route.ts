import { NextResponse } from 'next/server';
import { BARCODE_RE, loadProductByBarcode } from '@/lib/products/loader';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ barcode: string }> },
) {
  const { barcode } = await ctx.params;
  if (!BARCODE_RE.test(barcode)) {
    return NextResponse.json({ error: 'Invalid barcode' }, { status: 400 });
  }
  const product = await loadProductByBarcode(barcode);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ product });
}
