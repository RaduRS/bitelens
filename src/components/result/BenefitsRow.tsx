import type { OrganBenefit } from '@/types/organ';
import { ORGAN_META } from '@/lib/organs/registry';
import { GutIcon } from './GutIcon';

export function BenefitsRow({ benefits }: { benefits: OrganBenefit[] }) {
  if (benefits.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {benefits.map(b => {
        const meta = ORGAN_META[b.organ];
        const LucideIcon = meta.lucide;
        return (
          <div
            key={b.organ}
            className="inline-flex items-center gap-2"
            style={{
              padding: '8px 12px',
              borderRadius: 999,
              background: `color-mix(in oklab, ${meta.color} 10%, transparent)`,
              border: `0.5px solid color-mix(in oklab, ${meta.color} 35%, transparent)`,
              color: meta.color,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {meta.source === 'lucide' && LucideIcon ? (
              <LucideIcon size={14} strokeWidth={1.6} />
            ) : (
              <GutIcon size={14} />
            )}
            <span>{meta.label}</span>
          </div>
        );
      })}
    </div>
  );
}
