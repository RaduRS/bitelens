'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ulid } from 'ulid';
import type { Product } from '@/types/product';
import { TopBar } from '@/components/layout/TopBar';
import { IconButton } from '@/components/ui/IconButton';
import { ScanTypeIcon } from '@/components/ui/ScanTypeIcon';
import { ProductThumb } from '@/components/product/ProductThumb';
import { VerdictRing } from '@/components/verdict/VerdictRing';
import { NutriScoreBadge } from '@/components/badges/NutriScoreBadge';
import { NovaPill } from '@/components/badges/NovaPill';
import { EcoScoreBadge } from '@/components/badges/EcoScoreBadge';
import { AllergenAlert } from '@/components/result/AllergenAlert';
import { ReasonRow } from '@/components/result/ReasonRow';
import { FlagChip } from '@/components/result/FlagChip';
import { NutritionBlock } from '@/components/result/NutritionBlock';
import { AdditiveRow } from '@/components/result/AdditiveRow';
import { BenefitsRow } from '@/components/result/BenefitsRow';
import { NoBenefits } from '@/components/result/NoBenefits';
import { ConfidenceBar } from '@/components/result/ConfidenceBar';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { AlternativePreviewCard } from '@/components/product/AlternativePreviewCard';
import type { ProductPreview } from '@/lib/off/search';
import { ALLERGEN_LABELS } from '@/fixtures/profile-options';
import { useProfile } from '@/hooks/useProfile';
import { useFavorites } from '@/hooks/useFavorites';
import { evaluate } from '@/lib/rules/engine';
import { recordScan } from '@/lib/history/storage';
import { VERDICT } from '@/components/verdict/verdict-tokens';
import { FavoriteButton } from '@/components/ui/FavoriteButton';

const HIGHLIGHT = /sugar|syrup|maltitol|color|phosphoric|modified/i;

export function ResultClient({
  product, alternatives = [],
}: {
  product: Product; alternatives?: ProductPreview[];
}) {
  const router = useRouter();
  const { profile, hydrated } = useProfile();
  const { favorites, toggle: toggleFav } = useFavorites();
  const result = evaluate(product, profile);
  const v = VERDICT[result.verdict];
  const matchedAllergens = product.allergens.filter(a => profile.allergens.includes(a));
  const isFav = favorites.has(product.id);

  useEffect(() => {
    if (!hydrated) return;
    void recordScan({
      id: ulid(),
      barcode: product.id,
      scannedAt: Date.now(),
      verdict: result.verdict,
      score: result.score,
      favorite: false,
      snapshot: {
        brand: product.brand, name: product.name, subtitle: product.subtitle,
        swatch: product.swatch, glyph: product.glyph, type: product.type,
        nutriScore: product.nutriScore, ecoScore: product.ecoScore, novaGroup: product.novaGroup,
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, product.id]);

  return (
    <div className="relative h-screen overflow-y-auto">
      <div
        className="relative pb-7"
        style={{
          background: `linear-gradient(180deg, color-mix(in oklab, ${v.color} 12%, var(--color-bg)) 0%, var(--color-bg) 70%)`,
        }}
      >
        <TopBar
          onBack={() => router.push('/')}
          right={
            <>
              <FavoriteButton active={isFav} onToggle={() => toggleFav(product.id)} />
              {product.type === 'barcode' && (
                <IconButton onClick={() => router.push(`/compare/${product.id}`)} aria-label="Compare">
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <rect x="1" y="3" width="5" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    <rect x="8" y="3" width="5" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </IconButton>
              )}
            </>
          }
        />

        <div className="px-6 pt-2">
          <div
            className="mb-[18px] flex items-center gap-2 font-mono uppercase text-text-dim"
            style={{ fontSize: 11, letterSpacing: '0.16em' }}
          >
            <ScanTypeIcon type={product.type} />
            {product.type === 'photo' ? 'Photo Result' : 'Barcode Result'}
          </div>

          <div className="mb-5 flex items-center gap-4">
            <ProductThumb product={product} size={64} radius={14} />
            <div className="min-w-0 flex-1">
              {product.brand && (
                <div
                  className="mb-[3px] font-mono uppercase text-text-dim"
                  style={{ fontSize: 11, letterSpacing: '0.08em' }}
                >{product.brand}</div>
              )}
              <div
                className="mb-1 font-semibold text-text"
                style={{ fontSize: 21, lineHeight: 1.15, letterSpacing: '-0.02em' }}
              >{product.name}</div>
              <div className="text-text-dim" style={{ fontSize: 13 }}>{product.subtitle}</div>
            </div>
          </div>

          <div className="flex justify-center" style={{ padding: '8px 0 16px' }}>
            <VerdictRing verdict={result.verdict} score={result.score} size={156} animateIn />
          </div>

          <div
            className="text-center text-text"
            style={{ fontSize: 16, lineHeight: 1.45, padding: '0 12px', letterSpacing: '-0.005em' }}
          >{result.summary}</div>

          <div className="mt-[18px] flex flex-wrap justify-center gap-2">
            {product.nutriScore && <NutriScoreBadge grade={product.nutriScore} />}
            {product.novaGroup && <NovaPill group={product.novaGroup} />}
            {product.ecoScore && <EcoScoreBadge grade={product.ecoScore} />}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-5 pb-8">
        {product.type === 'photo' && product.confidence != null && (
          <ConfidenceBar value={product.confidence} />
        )}
        {matchedAllergens.length > 0 && <AllergenAlert matched={matchedAllergens} />}

        {result.benefits.length > 0 ? (
          <div>
            <SectionLabel>Good for</SectionLabel>
            <BenefitsRow benefits={result.benefits} />
          </div>
        ) : result.verdict === 'avoid' && result.score < 30 ? (
          <NoBenefits />
        ) : null}

        <div>
          <SectionLabel>Why · {result.reasons.length} signals</SectionLabel>
          <div
            className="bg-surface"
            style={{ borderRadius: 14, padding: '6px 16px', border: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            {result.reasons.map((r, i) => (
              <div
                key={i}
                style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }}
              >
                <ReasonRow {...r} />
              </div>
            ))}
          </div>
        </div>

        {result.flags.length > 0 && (
          <div>
            <SectionLabel>Flags</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {result.flags.map((f, i) => <FlagChip key={i} {...f} />)}
            </div>
          </div>
        )}

        <div>
          <SectionLabel>Nutrition</SectionLabel>
          <NutritionBlock nutrition={product.nutrition} />
        </div>

        {product.additives.length > 0 && (
          <div>
            <SectionLabel>Additives · {product.additives.length}</SectionLabel>
            <div
              className="overflow-hidden bg-surface"
              style={{ borderRadius: 14, border: '0.5px solid rgba(255,255,255,0.06)' }}
            >
              {product.additives.map((a, i) => (
                <AdditiveRow key={a.code} additive={a} isLast={i === product.additives.length - 1} />
              ))}
            </div>
          </div>
        )}

        {product.allergens.length > 0 && (
          <div>
            <SectionLabel>Allergens</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {product.allergens.map(a => {
                const isMatch = matchedAllergens.includes(a);
                return (
                  <div
                    key={a}
                    style={{
                      padding: '6px 12px', borderRadius: 999,
                      background: isMatch ? 'color-mix(in oklab, var(--color-red) 14%, transparent)' : 'rgba(255,255,255,0.04)',
                      border: isMatch ? '0.5px solid color-mix(in oklab, var(--color-red) 35%, transparent)' : '0.5px solid rgba(255,255,255,0.07)',
                      color: isMatch ? 'var(--color-red)' : 'var(--color-text)',
                      fontSize: 12, fontWeight: 500,
                    }}
                  >{ALLERGEN_LABELS[a]}</div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <SectionLabel>{product.type === 'photo' ? 'Detected components' : 'Ingredients'}</SectionLabel>
          <div
            className="bg-surface text-text"
            style={{
              padding: 16, borderRadius: 14, fontSize: 14, lineHeight: 1.6,
              border: '0.5px solid rgba(255,255,255,0.06)', letterSpacing: '-0.005em',
            }}
          >
            {(product.ingredients ?? product.components ?? []).map((ing, i, arr) => (
              <span key={i}>
                <span style={{ color: HIGHLIGHT.test(ing) ? 'var(--color-amber)' : 'inherit' }}>{ing}</span>
                {i < arr.length - 1 && <span className="text-text-dim">, </span>}
              </span>
            ))}
          </div>
        </div>

        {result.verdict !== 'good' && alternatives.length > 0 && (
          <div>
            <SectionLabel>Healthier alternatives · {alternatives.length}</SectionLabel>
            <div
              className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1"
              style={{ scrollbarWidth: 'none' }}
            >
              {alternatives.map(alt => (
                <AlternativePreviewCard
                  key={alt.id}
                  product={alt}
                  onClick={() => router.push(`/result/${alt.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => router.push(product.type === 'photo' ? '/photo' : '/barcode')}
          className="flex w-full cursor-pointer items-center justify-center gap-2 text-bg"
          style={{
            padding: 16, border: 0, borderRadius: 14,
            background: 'var(--color-accent)',
            fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
            boxShadow: '0 0 24px var(--color-accent-glow)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 8a6 6 0 0110.5-4M14 8a6 6 0 01-10.5 4M12 1V5H8M4 15V11H8" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Scan another
        </button>
      </div>
    </div>
  );
}
