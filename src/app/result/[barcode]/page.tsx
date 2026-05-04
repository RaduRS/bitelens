import { notFound } from 'next/navigation';
import { ResultClient } from './result-client';
import { PhotoResultClient } from './photo-result-client';
import { loadProductByBarcode } from '@/lib/products/loader';
import { findHealthierAlternatives } from '@/lib/off/alternatives';

interface Props {
  params: Promise<{ barcode: string }>;
}

export default async function ResultPage({ params }: Props) {
  const { barcode } = await params;
  if (barcode.startsWith('photo_')) {
    return <PhotoResultClient id={barcode} />;
  }
  const product = await loadProductByBarcode(barcode);
  if (!product) notFound();

  const alternatives = await findHealthierAlternatives(barcode).catch(() => []);
  return <ResultClient product={product} alternatives={alternatives} />;
}
