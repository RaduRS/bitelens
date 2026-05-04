import { notFound } from 'next/navigation';
import { CompareClient } from './compare-client';
import { loadProductByBarcode } from '@/lib/products/loader';

interface Props {
  params: Promise<{ a: string }>;
  searchParams: Promise<{ b?: string }>;
}

export default async function ComparePage({ params, searchParams }: Props) {
  const [{ a }, { b }] = await Promise.all([params, searchParams]);
  const productA = await loadProductByBarcode(a);
  if (!productA) notFound();
  const productB = b ? await loadProductByBarcode(b) : null;
  return <CompareClient productA={productA} productB={productB} />;
}
