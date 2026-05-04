export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="10" fill="none" stroke="var(--color-accent)" strokeWidth="1.4" />
        <circle cx="11" cy="11" r="5" fill="none" stroke="var(--color-accent)" strokeWidth="1.4" />
        <circle cx="11" cy="11" r="1.6" fill="var(--color-accent)" />
      </svg>
      <span
        className="text-text font-semibold"
        style={{ fontSize: size * 0.82, letterSpacing: '-0.02em' }}
      >BiteLens</span>
    </div>
  );
}
