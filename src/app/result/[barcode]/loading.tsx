export default function Loading() {
  return (
    <div className="relative h-screen overflow-hidden">
      <div style={{ padding: '60px 20px 12px' }}>
        <div
          className="h-9 w-9 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.08)' }}
        />
      </div>

      <div className="flex flex-col items-center px-6">
        <div
          className="mb-5 h-4 w-24 rounded animate-bl-fadein"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />

        <div
          className="relative my-4 flex items-center justify-center animate-bl-fadein"
          style={{ width: 156, height: 156 }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, var(--color-accent-glow) 0%, transparent 65%)',
              opacity: 0.35,
              filter: 'blur(10px)',
            }}
          />
          <svg width="156" height="156" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="78" cy="78" r="74" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          </svg>
          <span
            className="absolute animate-bl-pulse"
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--color-accent)',
              boxShadow: '0 0 12px var(--color-accent-glow)',
            }}
          />
        </div>

        <div
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            color: 'var(--color-accent)',
            letterSpacing: '0.22em',
          }}
        >
          Loading
        </div>
      </div>
    </div>
  );
}
