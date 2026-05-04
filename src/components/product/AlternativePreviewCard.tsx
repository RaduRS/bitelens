'use client';
import type { ProductPreview } from '@/lib/off/search';
import { ProductThumb } from './ProductThumb';
import { NutriScoreBadge } from '@/components/badges/NutriScoreBadge';

export function AlternativePreviewCard({
  product, onClick,
}: {
  product: ProductPreview; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-shrink-0 cursor-pointer flex-col gap-2.5 bg-surface text-left text-inherit"
      style={{
        width: 168, padding: 14, borderRadius: 16,
        border: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between">
        <ProductThumb product={{ swatch: '#7a8a5e', glyph: (product.name[0] ?? '?').toUpperCase() }} size={40} />
        {product.nutriScore && <NutriScoreBadge grade={product.nutriScore} />}
      </div>
      <div>
        <div
          className="mb-[3px] overflow-hidden text-ellipsis whitespace-nowrap font-mono uppercase text-text-dim"
          style={{ fontSize: 10, letterSpacing: '0.08em' }}
        >{product.brand}</div>
        <div
          className="overflow-hidden text-text"
          style={{
            fontSize: 13, fontWeight: 500, lineHeight: 1.3, letterSpacing: '-0.005em',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}
        >{product.name}</div>
      </div>
    </button>
  );
}
