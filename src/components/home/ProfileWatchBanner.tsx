'use client';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/types/profile';
import { ALLERGEN_LABELS } from '@/fixtures/profile-options';

export function ProfileWatchBanner({ profile }: { profile: Profile }) {
  const router = useRouter();
  if (profile.allergens.length === 0) return null;
  return (
    <div className="px-5 pt-5">
      <div
        className="flex items-center gap-2.5"
        style={{
          padding: '12px 14px', borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          className="flex flex-shrink-0 items-center justify-center"
          style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'color-mix(in oklab, var(--color-accent) 14%, transparent)',
            color: 'var(--color-accent)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 6.5L5 9L10 3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex-1 text-text-dim" style={{ fontSize: 12 }}>
          Watching for{' '}
          <span className="text-text" style={{ fontWeight: 500 }}>
            {profile.allergens.map(a => ALLERGEN_LABELS[a]).join(', ')}
          </span>{' '}· {profile.goals.length} goal{profile.goals.length === 1 ? '' : 's'}
        </div>
        <button
          onClick={() => router.push('/you')}
          className="cursor-pointer border-0 bg-transparent"
          style={{ color: 'var(--color-accent)', fontSize: 12, fontWeight: 500 }}
        >Edit</button>
      </div>
    </div>
  );
}
