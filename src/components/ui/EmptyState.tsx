export function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
      <div
        className="mb-1 flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px dashed rgba(255,255,255,0.1)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" style={{ color: 'var(--color-text-dim)' }}>
          <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M11 7V11L13.5 12.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      <div className="text-[15px] font-semibold text-text">{title}</div>
      <div className="max-w-[240px] text-[13px] leading-[1.5] text-text-dim">{sub}</div>
    </div>
  );
}
