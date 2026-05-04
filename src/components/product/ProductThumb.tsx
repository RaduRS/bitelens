'use client';
import { useState } from 'react';
import type { Product } from '@/types/product';

type ThumbProduct = Pick<Product, 'swatch' | 'glyph'> & {
  imageUrl?: string | null;
  name?: string;
};

export function ProductThumb({
  product, size = 44, radius = 10,
}: { product: ThumbProduct; size?: number; radius?: number }) {
  const [errored, setErrored] = useState(false);
  const showImage = !errored && !!product.imageUrl;

  return (
    <div
      className="relative flex flex-shrink-0 items-center justify-center overflow-hidden font-mono"
      style={{
        width: size, height: size, borderRadius: radius,
        background: showImage
          ? '#1a1d15'
          : `linear-gradient(135deg, ${product.swatch} 0%, color-mix(in oklab, ${product.swatch} 60%, #000) 100%)`,
        fontWeight: 500, fontSize: size * 0.42, color: 'rgba(255,255,255,0.85)',
        boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.08), 0 1px 0 rgba(0,0,0,0.4)',
      }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl as string}
          alt={product.name ?? ''}
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ borderRadius: radius }}
        />
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 8px)',
            }}
          />
          <span className="relative">{product.glyph}</span>
        </>
      )}
    </div>
  );
}
