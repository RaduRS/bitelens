export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center" style={{ paddingBottom: 72 }}>
      <span
        className="animate-bl-pulse"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--color-accent)',
          boxShadow: '0 0 12px var(--color-accent-glow)',
        }}
      />
    </div>
  );
}
