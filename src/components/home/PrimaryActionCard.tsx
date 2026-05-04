import type { ReactNode } from 'react';

interface Props {
  tone: 'primary' | 'ghost';
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  onClick?: () => void;
}

export function PrimaryActionCard({ tone, eyebrow, title, subtitle, icon, onClick }: Props) {
  const isPrimary = tone === 'primary';
  return (
    <button
      onClick={onClick}
      className="relative flex w-full cursor-pointer items-center gap-4 overflow-hidden text-left text-text"
      style={{
        padding: 20, borderRadius: 22,
        background: isPrimary
          ? 'linear-gradient(135deg, color-mix(in oklab, var(--color-accent) 18%, var(--color-surface)) 0%, var(--color-surface) 80%)'
          : 'var(--color-surface)',
        border: isPrimary
          ? '0.5px solid color-mix(in oklab, var(--color-accent) 40%, transparent)'
          : '0.5px solid rgba(255,255,255,0.07)',
        boxShadow: isPrimary ? '0 0 24px color-mix(in oklab, var(--color-accent) 12%, transparent)' : 'none',
      }}
    >
      <div
        className="flex flex-shrink-0 items-center justify-center"
        style={{
          width: 52, height: 52, borderRadius: 14,
          background: isPrimary ? 'color-mix(in oklab, var(--color-accent) 18%, transparent)' : 'rgba(255,255,255,0.05)',
          border: isPrimary ? '0.5px solid color-mix(in oklab, var(--color-accent) 40%, transparent)' : '0.5px solid rgba(255,255,255,0.07)',
          color: isPrimary ? 'var(--color-accent)' : 'var(--color-text)',
        }}
      >{icon}</div>
      <div className="min-w-0 flex-1">
        <div
          className="mb-1 font-mono uppercase"
          style={{
            fontSize: 10,
            color: isPrimary ? 'var(--color-accent)' : 'var(--color-text-dim)',
            letterSpacing: '0.18em',
          }}
        >{eyebrow}</div>
        <div className="mb-0.5 font-semibold" style={{ fontSize: 17, letterSpacing: '-0.01em' }}>{title}</div>
        <div className="text-text-dim" style={{ fontSize: 12 }}>{subtitle}</div>
      </div>
      <svg width="18" height="18" viewBox="0 0 18 18" style={{ color: 'var(--color-text-dim)' }}>
        <path d="M5 3L11 9L5 15" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
