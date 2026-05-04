'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { RecentRow } from '@/components/product/RecentRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHistory } from '@/hooks/useHistory';
import { useFavorites } from '@/hooks/useFavorites';
import type { VerdictLevel } from '@/types/verdict';

type FilterId = 'all' | 'favorites' | VerdictLevel;
const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all',       label: 'All' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'good',      label: 'Good' },
  { id: 'caution',   label: 'Caution' },
  { id: 'avoid',     label: 'Avoid' },
];

export default function HistoryPage() {
  const router = useRouter();
  const { scans, hydrated, clear } = useHistory();
  const { favorites } = useFavorites();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');

  async function handleClear() {
    if (scans.length === 0) return;
    const ok = window.confirm(`Clear all ${scans.length} scans? This cannot be undone.`);
    if (ok) await clear();
  }

  const filtered = scans.filter(s => {
    if (filter === 'favorites') {
      if (!favorites.has(s.barcode)) return false;
    } else if (filter !== 'all' && s.verdict !== filter) {
      return false;
    }
    if (q) {
      const needle = q.toLowerCase();
      if (!s.snapshot.name.toLowerCase().includes(needle) && !s.snapshot.brand.toLowerCase().includes(needle)) return false;
    }
    return true;
  });

  return (
    <div className="flex h-full flex-col" style={{ paddingBottom: 72 }}>
      <TopBar
        title="History"
        right={
          scans.length > 0 ? (
            <button
              onClick={handleClear}
              className="cursor-pointer font-mono uppercase text-text-dim"
              style={{
                background: 'transparent', border: 0, padding: '4px 8px',
                fontSize: 11, letterSpacing: '0.1em',
              }}
              aria-label="Clear all history"
            >Clear</button>
          ) : (
            <div style={{ width: 36, height: 36 }} />
          )
        }
      />
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
            placeholder="Search recents"
            className="flex-1 border-0 bg-transparent outline-none text-text"
            style={{ fontSize: 14, letterSpacing: '-0.005em' }}
          />
        </div>
      </div>
      <div className="flex gap-2 px-5 pb-4">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="cursor-pointer"
            style={{
              padding: '7px 14px', borderRadius: 999,
              background: filter === f.id ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: '0.5px solid rgba(255,255,255,0.07)',
              color: filter === f.id ? 'var(--color-text)' : 'var(--color-text-dim)',
              fontSize: 12, fontWeight: 500,
            }}
          >{f.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {!hydrated ? (
          <div
            className="bg-surface"
            style={{ borderRadius: 16, padding: 32, border: '0.5px solid rgba(255,255,255,0.06)' }}
          />
        ) : filtered.length > 0 ? (
          <div
            className="overflow-hidden bg-surface"
            style={{ borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            {filtered.map((s, i) => (
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
                    favorite: favorites.has(s.barcode), verdict: s.verdict, score: s.score,
                  }}
                  onClick={() => router.push(`/result/${s.barcode}`)}
                  showFav
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={q ? 'No matches' : filter === 'favorites' ? 'No favorites yet' : 'No recent scans yet'}
            sub={
              q ? 'Try a different search.'
              : filter === 'favorites' ? 'Tap the star on a product to favorite it.'
              : 'Scans will appear here automatically.'
            }
          />
        )}
      </div>
    </div>
  );
}
