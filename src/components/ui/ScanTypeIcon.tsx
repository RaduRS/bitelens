export function ScanTypeIcon({ type }: { type: 'barcode' | 'photo' }) {
  const c = 'var(--color-text-dim)';
  if (type === 'barcode') {
    return (
      <svg width="11" height="11" viewBox="0 0 11 11">
        <rect x="0.5" y="1" width="1" height="9" fill={c} />
        <rect x="2.5" y="1" width="0.5" height="9" fill={c} />
        <rect x="4" y="1" width="1.5" height="9" fill={c} />
        <rect x="6.5" y="1" width="0.5" height="9" fill={c} />
        <rect x="8" y="1" width="1" height="9" fill={c} />
        <rect x="10" y="1" width="0.5" height="9" fill={c} />
      </svg>
    );
  }
  return (
    <svg width="11" height="11" viewBox="0 0 11 11">
      <rect x="0.5" y="2.5" width="10" height="7.5" rx="1.2" fill="none" stroke={c} strokeWidth="0.8" />
      <circle cx="5.5" cy="6.25" r="2" fill="none" stroke={c} strokeWidth="0.8" />
      <rect x="4" y="1" width="3" height="1.5" rx="0.4" fill={c} />
    </svg>
  );
}
