'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Corners } from './Corners';

type Phase = 'idle' | 'scanning' | 'success' | 'error';

export function Scanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    (async () => {
      try {
        if (!videoRef.current) return;
        setPhase('scanning');
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, _err, ctrl) => {
            if (result) {
              setPhase('success');
              ctrl.stop();
              const code = result.getText();
              setTimeout(() => router.push(`/result/${encodeURIComponent(code)}`), 600);
            }
          },
        );
        controlsRef.current = controls;
      } catch (e) {
        setPhase('error');
        setErrorText(e instanceof Error ? e.message : 'Camera unavailable');
      }
    })();

    return () => {
      controlsRef.current?.stop();
    };
  }, [router]);

  const submitManual = (code: string) => {
    const trimmed = code.trim();
    if (!/^\d{6,14}$/.test(trimmed)) return;
    router.push(`/result/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="relative h-full overflow-hidden bg-black">
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)' }}
      />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 280, height: 180 }}>
        <Corners verdict={phase === 'success' ? 'good' : undefined} />
        {phase === 'scanning' && (
          <div
            className="animate-bl-scan absolute"
            style={{
              left: 8, right: 8, height: 2, borderRadius: 1,
              background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)',
              boxShadow: '0 0 12px var(--color-accent-glow), 0 0 24px var(--color-accent-glow)',
            }}
          />
        )}
        {phase === 'success' && (
          <div
            className="animate-bl-pop absolute inset-0 flex items-center justify-center"
            style={{
              background: 'color-mix(in oklab, var(--color-accent) 12%, transparent)',
              borderRadius: 12,
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--color-accent)',
                boxShadow: '0 0 24px var(--color-accent-glow)',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 26 26">
                <path d="M7 13L11 17L19 9" stroke="#0a0a0b" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-28 left-0 right-0 px-8 text-center">
        <div
          className="inline-flex items-center gap-2 text-text"
          style={{
            padding: '10px 16px', borderRadius: 999,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            fontSize: 13,
          }}
        >
          {phase === 'scanning' && (
            <>
              <span
                className="animate-bl-pulse"
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent-glow)',
                }}
              />
              Hold steady — scanning
            </>
          )}
          {phase === 'success' && <><span style={{ color: 'var(--color-accent)' }}>✓</span> Got it</>}
          {phase === 'error' && <span style={{ color: 'var(--color-red)' }}>{errorText}</span>}
        </div>
      </div>

      {phase === 'error' && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center px-6">
          <ManualInput onSubmit={submitManual} />
        </div>
      )}
    </div>
  );
}

function ManualInput({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [v, setV] = useState('');
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(v); }}
      className="flex w-full max-w-sm items-center gap-2"
    >
      <input
        value={v} onChange={e => setV(e.target.value)} inputMode="numeric"
        placeholder="Enter barcode"
        className="flex-1 outline-none"
        style={{
          padding: '10px 14px', borderRadius: 12,
          background: 'rgba(255,255,255,0.06)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          color: 'var(--color-text)', fontSize: 14,
        }}
      />
      <button
        type="submit"
        className="cursor-pointer text-bg"
        style={{
          padding: '10px 14px', borderRadius: 12,
          background: 'var(--color-accent)', fontWeight: 600, border: 0,
        }}
      >Go</button>
    </form>
  );
}
