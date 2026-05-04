'use client';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types/product';
import { TopBar } from '@/components/layout/TopBar';
import { ProductThumb } from '@/components/product/ProductThumb';
import { VerdictBadge } from '@/components/verdict/VerdictBadge';
import { RecentRow } from '@/components/product/RecentRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useHistory } from '@/hooks/useHistory';
import { evaluate } from '@/lib/rules/engine';
import { bandToVerdict } from '@/lib/rules/score';
import { buildCompareRows, pickOverallWinner, type CompareRow } from '@/lib/compare/rows';

interface Props {
  productA: Product;
  productB: Product | null;
}

export function CompareClient({ productA, productB }: Props) {
  const router = useRouter();
  const { profile } = useProfile();

  const scoreA = useMemo(() => evaluate(productA, profile).score, [productA, profile]);
  const scoreB = useMemo(() => (productB ? evaluate(productB, profile).score : null), [productB, profile]);

  return (
    <div className="relative h-screen overflow-y-auto">
      <TopBar
        title="Compare"
        onBack={() => router.push(`/result/${productA.id}`)}
        right={<div style={{ width: 36, height: 36 }} />}
      />
      <div className="px-5 pb-8">
        {productB && scoreB != null ? (
          <CompareBody
            a={productA}
            scoreA={scoreA}
            b={productB}
            scoreB={scoreB}
            onSwap={() => router.replace(`/compare/${productA.id}`)}
          />
        ) : (
          <Picker
            a={productA}
            scoreA={scoreA}
            onPick={(barcode) => router.push(`/compare/${productA.id}?b=${barcode}`)}
          />
        )}
      </div>
    </div>
  );
}

function CompareBody({
  a, scoreA, b, scoreB, onSwap,
}: {
  a: Product; scoreA: number; b: Product; scoreB: number; onSwap: () => void;
}) {
  const rows = useMemo(() => buildCompareRows({ a, scoreA, b, scoreB }), [a, scoreA, b, scoreB]);
  const winner = pickOverallWinner(scoreA, scoreB);

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <ProductHead p={a} score={scoreA} />
        <ProductHead p={b} score={scoreB} />
      </div>

      <div
        className="overflow-hidden bg-surface"
        style={{ borderRadius: 14, border: '0.5px solid rgba(255,255,255,0.06)' }}
      >
        {rows.map((row, i) => (
          <Row key={row.label} row={row} isFirst={i === 0} />
        ))}
      </div>

      <div
        className="text-center text-text-dim"
        style={{ marginTop: 18, fontSize: 12, lineHeight: 1.5 }}
      >
        {winner === 'a' && <><span style={{ color: 'var(--color-accent)' }}>{a.name}</span> wins on overall score.</>}
        {winner === 'b' && <><span style={{ color: 'var(--color-accent)' }}>{b.name}</span> wins on overall score.</>}
        {winner === null && <>Both score the same overall.</>}
      </div>

      <button
        onClick={onSwap}
        className="mt-4 w-full cursor-pointer text-text-dim"
        style={{
          padding: '12px 16px', border: '0.5px solid rgba(255,255,255,0.07)',
          borderRadius: 12, background: 'transparent',
          fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em',
        }}
      >Pick a different product</button>
    </>
  );
}

function ProductHead({ p, score }: { p: Product; score: number }) {
  return (
    <div
      className="flex flex-col gap-2.5 bg-surface"
      style={{ padding: 14, borderRadius: 14, border: '0.5px solid rgba(255,255,255,0.06)' }}
    >
      <ProductThumb product={p} size={40} />
      <div>
        {p.brand && (
          <div
            className="mb-[2px] font-mono uppercase text-text-dim"
            style={{ fontSize: 10, letterSpacing: '0.08em' }}
          >{p.brand}</div>
        )}
        <div
          className="text-text"
          style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2 }}
        >{p.name}</div>
      </div>
      <VerdictBadge verdict={bandToVerdict(score)} score={score} size="sm" />
    </div>
  );
}

function Row({ row, isFirst }: { row: CompareRow; isFirst: boolean }) {
  return (
    <div
      className="grid items-center"
      style={{
        gridTemplateColumns: '1fr auto 1fr', gap: 12, padding: '12px 16px',
        borderTop: isFirst ? 'none' : '0.5px solid rgba(255,255,255,0.05)',
      }}
    >
      <Cell value={row.valueA} unit={row.unit} highlighted={row.winner === 'a'} align="right" />
      <div
        className="text-center font-mono uppercase text-text-dim"
        style={{ fontSize: 10, letterSpacing: '0.1em', minWidth: 64 }}
      >{row.label}</div>
      <Cell value={row.valueB} unit={row.unit} highlighted={row.winner === 'b'} align="left" />
    </div>
  );
}

function Cell({
  value, unit, highlighted, align,
}: {
  value: CompareRow['valueA']; unit?: string; highlighted: boolean; align: 'left' | 'right';
}) {
  return (
    <div
      className="font-mono"
      style={{
        textAlign: align,
        fontSize: 16, fontWeight: 500,
        color: highlighted ? 'var(--color-accent)' : 'var(--color-text)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
      {unit && <span className="text-text-dim" style={{ fontSize: 10, marginLeft: 2 }}>{unit}</span>}
    </div>
  );
}

function Picker({
  a, scoreA, onPick,
}: {
  a: Product; scoreA: number; onPick: (barcode: string) => void;
}) {
  const { scans, hydrated } = useHistory();
  const candidates = scans.filter(s => s.barcode !== a.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2.5">
        <ProductHead p={a} score={scoreA} />
        <div
          className="flex flex-col items-center justify-center gap-2 text-text-dim"
          style={{
            padding: 14, borderRadius: 14,
            background: 'transparent',
            border: '0.5px dashed rgba(255,255,255,0.12)',
            minHeight: 138,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ color: 'var(--color-text-dim)' }}>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <div className="text-center" style={{ fontSize: 11, lineHeight: 1.4 }}>
            Pick something to<br />compare against
          </div>
        </div>
      </div>

      <div
        className="font-mono uppercase text-text-dim"
        style={{ fontSize: 11, letterSpacing: '0.16em', marginTop: 4 }}
      >From your scans</div>

      {!hydrated ? (
        <div
          className="bg-surface"
          style={{ borderRadius: 14, padding: 24, border: '0.5px solid rgba(255,255,255,0.06)' }}
        />
      ) : candidates.length > 0 ? (
        <div
          className="overflow-hidden bg-surface"
          style={{ borderRadius: 14, border: '0.5px solid rgba(255,255,255,0.06)' }}
        >
          {candidates.map((s, i) => (
            <div
              key={s.id}
              style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }}
            >
              <RecentRow
                product={{
                  id: s.barcode, type: s.snapshot.type,
                  brand: s.snapshot.brand, name: s.snapshot.name, subtitle: s.snapshot.subtitle,
                  swatch: s.snapshot.swatch, glyph: s.snapshot.glyph,
                  imageUrl: s.snapshot.imageUrl,
                  nutriScore: s.snapshot.nutriScore, ecoScore: s.snapshot.ecoScore, novaGroup: s.snapshot.novaGroup,
                  allergens: [], additives: [],
                  nutrition: { serving: '', kcal: 0, protein: 0, carbs: 0, sugar: 0, fat: 0, satFat: 0, fiber: 0, sodium: 0 },
                  favorite: s.favorite, verdict: s.verdict, score: s.score,
                }}
                onClick={() => onPick(s.barcode)}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing to compare yet"
          sub="Scan another product first, then come back to compare."
        />
      )}
    </div>
  );
}

