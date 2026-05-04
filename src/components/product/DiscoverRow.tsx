'use client';
import type { ProductPreview } from '@/lib/off/search';
import { ProductThumb } from './ProductThumb';
import { NutriScoreBadge } from '@/components/badges/NutriScoreBadge';
import { NovaPill } from '@/components/badges/NovaPill';

export function DiscoverRow({
  product, onClick,
}: {
  product: ProductPreview; onClick?: () => void;
}) {
  const thumbProduct = {
    swatch: '#7a8a5e',
    glyph: (product.name[0] ?? '?').toUpperCase(),
  };
  return (
    <button
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3.5 border-0 bg-transparent px-4 py-3 text-left text-inherit"
    >
      <ProductThumb product={thumbProduct} size={44} />
      <div className="min-w-0 flex-1">
        <div
          className="mb-[3px] font-mono uppercase text-text-dim"
          style={{ fontSize: 10, letterSpacing: '0.1em' }}
        >{product.brand}</div>
        <div
          className="overflow-hidden text-ellipsis whitespace-nowrap text-text"
          style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em' }}
        >{product.name}</div>
      </div>
      <div className="flex items-center gap-1.5">
        {product.nutriScore && <NutriScoreBadge grade={product.nutriScore} />}
        {product.novaGroup && <NovaPill group={product.novaGroup} />}
      </div>
    </button>
  );
}
