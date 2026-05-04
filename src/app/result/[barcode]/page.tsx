import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { ResultClient } from './result-client';
import type { Product } from '@/types/product';

interface Props {
  params: Promise<{ barcode: string }>;
}

export default async function ResultPage({ params }: Props) {
  const { barcode } = await params;
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const res = await fetch(`${proto}://${host}/api/products/${encodeURIComponent(barcode)}`, { cache: 'no-store' });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Product fetch failed: ${res.status}`);
  const { product } = (await res.json()) as { product: Product };
  return <ResultClient product={product} />;
}
