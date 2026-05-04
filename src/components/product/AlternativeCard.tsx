import type { Product } from '@/types/product';
import type { VerdictLevel } from '@/types/verdict';
import { ProductThumb } from './ProductThumb';
import { VERDICT } from '@/components/verdict/verdict-tokens';

interface Props {
  product: Product & { verdict: VerdictLevel; score: number };
  onClick?: () => void;
}

export function AlternativeCard({ product, onClick }: Props) {
  const v = VERDICT[product.verdict];
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
        <ProductThumb product={product} size={40} />
        <div
          className="inline-flex items-center gap-1 font-mono font-semibold"
          style={{
            padding: '3px 7px', borderRadius: 999,
            background: `color-mix(in oklab, ${v.color} 14%, transparent)`,
            color: v.color, fontSize: 11,
          }}
        >
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: v.color }} />
          {product.score}
        </div>
      </div>
      <div>
        <div
          className="mb-[3px] font-mono uppercase text-text-dim"
          style={{ fontSize: 10, letterSpacing: '0.08em' }}
        >{product.brand}</div>
        <div
          className="text-text"
          style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, letterSpacing: '-0.005em' }}
        >{product.name}</div>
      </div>
    </button>
  );
}
