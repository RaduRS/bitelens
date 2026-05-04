'use client';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';

interface Props {
  title: string;
  description: string;
  showBack?: boolean;
}

export function ComingNext({ title, description, showBack }: Props) {
  const router = useRouter();
  return (
    <div className="flex h-full flex-col" style={{ paddingBottom: 72 }}>
      <TopBar
        title={title}
        onBack={showBack ? () => router.back() : undefined}
        right={!showBack ? <div style={{ width: 36, height: 36 }} /> : undefined}
      />
      <div className="flex flex-1 items-center justify-center px-6">
        <div
          className="max-w-sm text-center"
          style={{
            padding: 28, borderRadius: 18,
            background: 'var(--color-surface)',
            border: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="mx-auto mb-4 flex items-center justify-center"
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'color-mix(in oklab, var(--color-accent) 14%, transparent)',
              color: 'var(--color-accent)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M10 2v16M2 10h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div className="mb-2 font-semibold text-text" style={{ fontSize: 17 }}>{title}</div>
          <div className="text-text-dim" style={{ fontSize: 13, lineHeight: 1.5 }}>{description}</div>
        </div>
      </div>
    </div>
  );
}
