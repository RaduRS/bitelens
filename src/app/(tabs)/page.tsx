'use client';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { IconButton } from '@/components/ui/IconButton';
import { PrimaryActionCard } from '@/components/home/PrimaryActionCard';
import { QuickStats } from '@/components/home/QuickStats';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { RecentRow } from '@/components/product/RecentRow';
import { useHistory } from '@/hooks/useHistory';
import { useFavorites } from '@/hooks/useFavorites';

export default function HomePage() {
  const router = useRouter();
  const { scans } = useHistory();
  const { favorites } = useFavorites();

  const goodCount = scans.filter(s => s.verdict === 'good').length;
  const avgScore = scans.length
    ? Math.round(scans.reduce((s, r) => s + r.score, 0) / scans.length)
    : 0;

  return (
    <div className="flex h-full flex-col" style={{ paddingBottom: 72 }}>
      <TopBar
        right={
          <IconButton onClick={() => router.push('/you')} aria-label="Profile">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <circle cx="7" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
              <path d="M2 12c1.2-2.2 3-3.4 5-3.4s3.8 1.2 5 3.4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </svg>
          </IconButton>
        }
      />

      <div className="px-6 pt-4">
        <div
          className="mb-3.5 flex items-center gap-2 font-mono uppercase"
          style={{ fontSize: 11, color: 'var(--color-accent)', letterSpacing: '0.22em' }}
        >
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent-glow)',
            }}
          />
          Ready to scan
        </div>
        <h1
          className="m-0 font-semibold text-text"
          style={{ fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.025em' }}
        >
          Point. Scan.<br />
          <span className="text-text-dim">Understand.</span>
        </h1>
      </div>

      <QuickStats avgScore={avgScore} goodCount={goodCount} total={scans.length} />

      <div className="flex flex-col gap-3 px-5 pt-5">
        <PrimaryActionCard
          tone="primary" eyebrow="Primary" title="Scan a barcode" subtitle="For packaged products"
          href="/barcode"
          icon={
            <svg width="20" height="20" viewBox="0 0 22 22">
              <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <line x1="3.5" y1="5" x2="3.5" y2="17" /><line x1="6" y1="5" x2="6" y2="17" />
                <line x1="8.5" y1="5" x2="8.5" y2="17" /><line x1="11" y1="5" x2="11" y2="17" />
                <line x1="13.5" y1="5" x2="13.5" y2="17" /><line x1="16" y1="5" x2="16" y2="17" />
                <line x1="18.5" y1="5" x2="18.5" y2="17" />
              </g>
            </svg>
          }
        />
        <PrimaryActionCard
          tone="ghost" eyebrow="Visual" title="Photograph food" subtitle="Real meals & fresh items"
          href="/photo"
          icon={
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="11" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
              <rect x="7.5" y="3.5" width="7" height="3" rx="1" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          }
        />
      </div>

      <div className="flex-1 px-5 pt-6">
        <SectionLabel
          action={
            <button
              onClick={() => router.push('/history')}
              className="inline-flex cursor-pointer items-center border-0 bg-transparent font-mono uppercase text-text-dim"
              style={{ fontSize: 12, letterSpacing: '0.08em' }}
            >
              View all
              <svg width="9" height="9" viewBox="0 0 9 9" style={{ marginLeft: 4 }}>
                <path d="M2 1.5L6 4.5L2 7.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          }
        >Recent · {scans.length}</SectionLabel>
        {scans.length > 0 ? (
          <div
            className="overflow-hidden bg-surface"
            style={{ borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            {scans.slice(0, 3).map((s, i) => (
              <div
                key={s.id}
                style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }}
              >
                <RecentRow
                  product={{
                    ...s.product,
                    favorite: favorites.has(s.barcode),
                    verdict: s.verdict,
                    score: s.score,
                  }}
                  onClick={() => router.push(`/result/${s.barcode}`)}
                  showFav
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-center text-text-dim"
            style={{ padding: '20px 0', fontSize: 13 }}
          >No scans yet. Tap above to start.</div>
        )}
      </div>
    </div>
  );
}
