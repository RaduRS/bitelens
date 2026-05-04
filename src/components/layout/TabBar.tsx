'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Tab {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: 'scan', label: 'Scan', href: '/',
    icon: (
      <path
        d="M3 5V3a1 1 0 011-1h2M16 5V3a1 1 0 00-1-1h-2M3 13v2a1 1 0 001 1h2M16 13v2a1 1 0 01-1 1h-2M2 9.5h16"
        stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
    ),
  },
  {
    id: 'discover', label: 'Discover', href: '/discover',
    icon: (
      <>
        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <line x1="13" y1="13" x2="17" y2="17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: 'history', label: 'History', href: '/history',
    icon: (
      <>
        <circle cx="9" cy="10" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M9 6.5v3.5l2.4 1.4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: 'you', label: 'You', href: '/you',
    icon: (
      <>
        <circle cx="9" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M2.5 16c1.4-3 3.7-4.5 6.5-4.5s5.1 1.5 6.5 4.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </>
    ),
  },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 flex justify-around"
      style={{
        paddingBottom: 32, paddingTop: 6,
        background: 'rgba(10,10,11,0.85)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      {TABS.map(t => {
        const active = pathname === t.href || (t.href === '/' && pathname === '/');
        return (
          <Link
            key={t.id}
            href={t.href}
            prefetch
            className="flex flex-col items-center gap-[3px]"
            style={{
              padding: '6px 14px',
              color: active ? 'var(--color-accent)' : 'var(--color-text-dim)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20">{t.icon}</svg>
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.02em' }}>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
