'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { EmptyState } from '@/components/ui/EmptyState';
import { DiscoverRow } from '@/components/product/DiscoverRow';
import type { ProductPreview } from '@/lib/off/search';

interface Category {
  id: string;
  label: string;
  color: string;
}

const CATEGORIES: Category[] = [
  { id: 'snacks',    label: 'Snacks',  color: '#c9a86b' },
  { id: 'beverages', label: 'Drinks',  color: '#9bbf9b' },
  { id: 'dairies',   label: 'Dairy',   color: '#f5ecd9' },
  { id: 'meals',     label: 'Meals',   color: '#7a8a5e' },
  { id: 'sweets',    label: 'Sweets',  color: '#e8a3a3' },
  { id: 'groceries', label: 'Pantry',  color: '#5a4030' },
];

type View =
  | { kind: 'home' }
  | { kind: 'search'; q: string; loading: boolean; results: ProductPreview[] }
  | { kind: 'category'; id: string; label: string; loading: boolean; results: ProductPreview[] };

export function DiscoverClient({ initialTopRated }: { initialTopRated: ProductPreview[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [view, setView] = useState<View>({ kind: 'home' });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqRef = useRef(0);

  useEffect(() => {
    const trimmed = q.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!trimmed) {
      setView(v => (v.kind === 'search' ? { kind: 'home' } : v));
      return;
    }
    setView({ kind: 'search', q: trimmed, loading: true, results: [] });
    debounceRef.current = setTimeout(async () => {
      const seq = ++reqRef.current;
      try {
        const res = await fetch(`/api/discover?q=${encodeURIComponent(trimmed)}&limit=20`);
        const json = await res.json();
        if (seq !== reqRef.current) return;
        setView({ kind: 'search', q: trimmed, loading: false, results: json.products ?? [] });
      } catch {
        if (seq === reqRef.current) {
          setView({ kind: 'search', q: trimmed, loading: false, results: [] });
        }
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  async function pickCategory(c: Category) {
    setView({ kind: 'category', id: c.id, label: c.label, loading: true, results: [] });
    const seq = ++reqRef.current;
    try {
      const res = await fetch(`/api/discover?category=${encodeURIComponent(c.id)}&limit=20`);
      const json = await res.json();
      if (seq !== reqRef.current) return;
      setView({ kind: 'category', id: c.id, label: c.label, loading: false, results: json.products ?? [] });
    } catch {
      if (seq === reqRef.current) {
        setView({ kind: 'category', id: c.id, label: c.label, loading: false, results: [] });
      }
    }
  }

  function clearCategory() {
    reqRef.current++;
    setView({ kind: 'home' });
  }

  return (
    <div className="flex h-full flex-col" style={{ paddingBottom: 72 }}>
      <TopBar title="Discover" right={<div style={{ width: 36, height: 36 }} />} />

      <div className="px-5 pt-2 pb-4">
        <div
          className="flex items-center gap-2.5 bg-surface"
          style={{
            padding: '10px 14px', borderRadius: 12,
            border: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ color: 'var(--color-text-dim)' }}>
            <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search products or brands"
            className="flex-1 border-0 bg-transparent outline-none text-text"
            style={{ fontSize: 14, letterSpacing: '-0.005em' }}
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="cursor-pointer text-text-dim"
              style={{ background: 'transparent', border: 0, padding: 0, fontSize: 18, lineHeight: 1 }}
              aria-label="Clear search"
            >×</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {view.kind === 'search' ? (
          <SearchResults
            label={`Results · ${view.results.length}`}
            loading={view.loading}
            results={view.results}
            onPick={(id) => router.push(`/result/${id}`)}
            emptyTitle="No matches"
            emptySub="Try a different search."
          />
        ) : view.kind === 'category' ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={clearCategory}
              className="self-start cursor-pointer text-text-dim"
              style={{
                padding: '6px 12px', borderRadius: 999,
                border: '0.5px solid rgba(255,255,255,0.07)',
                background: 'transparent', fontSize: 12, fontWeight: 500,
              }}
            >← All categories</button>
            <SearchResults
              label={`${view.label} · ${view.results.length}`}
              loading={view.loading}
              results={view.results}
              onPick={(id) => router.push(`/result/${id}`)}
              emptyTitle={`Nothing in ${view.label}`}
              emptySub="Try another category or search."
            />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <SectionLabel>Categories</SectionLabel>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => pickCategory(c)}
                    className="flex cursor-pointer flex-col items-start justify-end text-text"
                    style={{
                      aspectRatio: '1', borderRadius: 14,
                      border: '0.5px solid rgba(255,255,255,0.06)',
                      background: `linear-gradient(135deg, color-mix(in oklab, ${c.color} 18%, var(--color-surface)) 0%, var(--color-surface) 80%)`,
                      padding: 12, fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, marginBottom: 6 }} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Top rated · {initialTopRated.length}</SectionLabel>
              {initialTopRated.length > 0 ? (
                <div
                  className="overflow-hidden bg-surface"
                  style={{ borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.06)' }}
                >
                  {initialTopRated.map((p, i) => (
                    <div
                      key={p.id}
                      style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }}
                    >
                      <DiscoverRow product={p} onClick={() => router.push(`/result/${p.id}`)} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Top rated unavailable"
                  sub="Check your connection and try again later."
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SearchResults({
  label, loading, results, onPick, emptyTitle, emptySub,
}: {
  label: string;
  loading: boolean;
  results: ProductPreview[];
  onPick: (id: string) => void;
  emptyTitle: string;
  emptySub: string;
}) {
  if (loading) {
    return (
      <>
        <SectionLabel>{label.replace(/· \d+$/, '')}</SectionLabel>
        <div
          className="bg-surface"
          style={{ borderRadius: 16, padding: 24, border: '0.5px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="animate-bl-spin"
            style={{
              width: 22, height: 22, margin: '0 auto', borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.12)',
              borderTopColor: 'var(--color-accent)',
            }}
          />
        </div>
      </>
    );
  }
  if (results.length === 0) {
    return <EmptyState title={emptyTitle} sub={emptySub} />;
  }
  return (
    <>
      <SectionLabel>{label}</SectionLabel>
      <div
        className="overflow-hidden bg-surface"
        style={{ borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.06)' }}
      >
        {results.map((p, i) => (
          <div
            key={p.id}
            style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }}
          >
            <DiscoverRow product={p} onClick={() => onPick(p.id)} />
          </div>
        ))}
      </div>
    </>
  );
}
