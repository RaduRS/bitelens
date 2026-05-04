import type { Product } from '@/types/product';

export function ProductThumb({
  product, size = 44, radius = 10,
}: { product: Pick<Product, 'swatch' | 'glyph'>; size?: number; radius?: number }) {
  return (
    <div
      className="relative flex flex-shrink-0 items-center justify-center overflow-hidden font-mono"
      style={{
        width: size, height: size, borderRadius: radius,
        background: `linear-gradient(135deg, ${product.swatch} 0%, color-mix(in oklab, ${product.swatch} 60%, #000) 100%)`,
        fontWeight: 500, fontSize: size * 0.42, color: 'rgba(255,255,255,0.85)',
        boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.08), 0 1px 0 rgba(0,0,0,0.4)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 8px)',
        }}
      />
      <span className="relative">{product.glyph}</span>
    </div>
  );
}
