import type { Product } from '@/types/product';
import { ProductThumb } from './ProductThumb';
import { ScanTypeIcon } from '@/components/ui/ScanTypeIcon';
import { VerdictBadge } from '@/components/verdict/VerdictBadge';
import type { VerdictLevel } from '@/types/verdict';

interface Props {
  product: Product & { verdict: VerdictLevel; score: number };
  onClick?: () => void;
  showFav?: boolean;
}

export function RecentRow({ product, onClick, showFav }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3.5 border-0 bg-transparent px-4 py-3 text-left text-inherit"
    >
      <ProductThumb product={product} size={44} />
      <div className="min-w-0 flex-1">
        <div className="mb-[3px] flex items-center gap-2">
          <ScanTypeIcon type={product.type} />
          <span
            className="font-mono uppercase text-text-dim"
            style={{ fontSize: 10, letterSpacing: '0.1em' }}
          >
            {product.type === 'barcode' ? 'Barcode' : 'Photo'}
            {product.timeAgo ? ` · ${product.timeAgo}` : ''}
          </span>
          {showFav && product.favorite && (
            <svg width="10" height="10" viewBox="0 0 10 10" style={{ color: 'var(--color-accent)' }}>
              <path d="M5 1L6.2 3.6L9 4L7 6L7.5 9L5 7.5L2.5 9L3 6L1 4L3.8 3.6L5 1Z" fill="currentColor" />
            </svg>
          )}
        </div>
        <div
          className="overflow-hidden text-ellipsis whitespace-nowrap text-text"
          style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em' }}
        >{product.name}</div>
      </div>
      <VerdictBadge verdict={product.verdict} score={product.score} size="sm" />
    </button>
  );
}
