import { notFound } from 'next/navigation';
import { ResultClient } from './result-client';
import { loadProductByBarcode } from '@/lib/products/loader';

interface Props {
  params: Promise<{ barcode: string }>;
}

export default async function ResultPage({ params }: Props) {
  const { barcode } = await params;
  const product = await loadProductByBarcode(barcode);
  if (!product) notFound();
  return <ResultClient product={product} />;
}
