'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types/product';
import { TopBar } from '@/components/layout/TopBar';
import { ResultClient } from '@/app/result/[barcode]/result-client';
import { putPhotoProduct } from '@/lib/photo-products/storage';

type Phase =
  | { kind: 'idle' }
  | { kind: 'analyzing'; previewUrl: string }
  | { kind: 'result'; product: Product }
  | { kind: 'error'; message: string; previewUrl?: string };

export default function PhotoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  useEffect(() => {
    return () => {
      if (phase.kind === 'analyzing') URL.revokeObjectURL(phase.previewUrl);
      if (phase.kind === 'error' && phase.previewUrl) URL.revokeObjectURL(phase.previewUrl);
    };
  }, [phase]);

  async function handleFile(file: File) {
    const previewUrl = URL.createObjectURL(file);
    setPhase({ kind: 'analyzing', previewUrl });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 75_000);
    try {
      const compressed = await compressImage(file).catch(() => null);
      const upload = compressed ?? file;

      const form = new FormData();
      form.append('photo', upload, 'meal.jpg');
      const res = await fetch('/api/photo/analyze', {
        method: 'POST', body: form, signal: controller.signal,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Server error (${res.status})`);
      const product = json.product as Product;
      await putPhotoProduct(product);
      URL.revokeObjectURL(previewUrl);
      setPhase({ kind: 'result', product });
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === 'AbortError';
      const message = aborted
        ? 'Analysis took too long. Check your connection and try again.'
        : e instanceof Error ? e.message : 'Could not analyze photo.';
      setPhase({ kind: 'error', message, previewUrl });
    } finally {
      clearTimeout(timeout);
    }
  }


  if (phase.kind === 'result') {
    return <ResultClient product={phase.product} />;
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      <TopBar
        onBack={() => router.push('/')}
        title="Photo scan"
        right={<div style={{ width: 36, height: 36 }} />}
      />

      <div className="flex flex-1 flex-col px-5 pb-8">
        {phase.kind === 'idle' && <IdleView onPick={() => fileInputRef.current?.click()} />}

        {phase.kind === 'analyzing' && <AnalyzingView previewUrl={phase.previewUrl} />}

        {phase.kind === 'error' && (
          <ErrorView
            message={phase.message}
            previewUrl={phase.previewUrl}
            onRetry={() => fileInputRef.current?.click()}
            onCancel={() => setPhase({ kind: 'idle' })}
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void handleFile(file);
          }}
        />
      </div>
    </div>
  );
}

function IdleView({ onPick }: { onPick: () => void }) {
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div
          className="flex items-center justify-center"
          style={{
            width: 96, height: 96, borderRadius: 24,
            background: 'color-mix(in oklab, var(--color-accent) 12%, transparent)',
            border: '0.5px solid color-mix(in oklab, var(--color-accent) 35%, transparent)',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 22 22" fill="none" style={{ color: 'var(--color-accent)' }}>
            <rect x="2" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="11" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
            <rect x="7.5" y="3.5" width="7" height="3" rx="1" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>
        <div>
          <div
            className="mb-2 font-semibold text-text"
            style={{ fontSize: 22, letterSpacing: '-0.02em' }}
          >Snap your meal</div>
          <div
            className="mx-auto text-text-dim"
            style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 280 }}
          >We&apos;ll identify the dish, estimate nutrition, and rate it.</div>
        </div>
      </div>

      <button
        onClick={onPick}
        className="flex w-full cursor-pointer items-center justify-center gap-2 text-bg"
        style={{
          padding: 16, border: 0, borderRadius: 14,
          background: 'var(--color-accent)',
          fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
          boxShadow: '0 0 24px var(--color-accent-glow)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="11" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="7.5" y="3.5" width="7" height="3" rx="1" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        Take or choose photo
      </button>
    </>
  );
}

function AnalyzingView({ previewUrl }: { previewUrl: string }) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden" style={{ borderRadius: 18 }}>
      <PreviewImage url={previewUrl} blurred />
      <div className="relative flex flex-col items-center gap-4 text-text">
        <Spinner />
        <div
          className="font-mono uppercase text-text"
          style={{ fontSize: 12, letterSpacing: '0.16em', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
        >Analyzing meal…</div>
      </div>
    </div>
  );
}

function ErrorView({
  message, previewUrl, onRetry, onCancel,
}: {
  message: string; previewUrl?: string; onRetry: () => void; onCancel: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      {previewUrl && (
        <div className="overflow-hidden" style={{ width: 200, height: 200, borderRadius: 18, opacity: 0.5 }}>
          <PreviewImage url={previewUrl} />
        </div>
      )}
      <div>
        <div
          className="mb-2 font-semibold"
          style={{ fontSize: 18, letterSpacing: '-0.01em', color: 'var(--color-red)' }}
        >Couldn&apos;t analyze that photo</div>
        <div
          className="mx-auto text-text-dim"
          style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 280 }}
        >{message}</div>
      </div>
      <div className="flex w-full gap-2">
        <button
          onClick={onCancel}
          className="flex-1 cursor-pointer text-text"
          style={{
            padding: 14, borderRadius: 12,
            border: '0.5px solid rgba(255,255,255,0.07)',
            background: 'transparent',
            fontSize: 14, fontWeight: 500,
          }}
        >Cancel</button>
        <button
          onClick={onRetry}
          className="flex-1 cursor-pointer text-bg"
          style={{
            padding: 14, border: 0, borderRadius: 12,
            background: 'var(--color-accent)',
            fontSize: 14, fontWeight: 600,
          }}
        >Try again</button>
      </div>
    </div>
  );
}

function PreviewImage({ url, blurred }: { url: string; blurred?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      style={{ filter: blurred ? 'blur(12px) brightness(0.55)' : 'none' }}
    />
  );
}

async function compressImage(
  file: File,
  maxDim = 1280,
  quality = 0.82,
): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not decode image'));
      i.src = url;
    });
    const longest = Math.max(img.width, img.height);
    const ratio = longest > maxDim ? maxDim / longest : 1;
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('toBlob returned null')),
        'image/jpeg',
        quality,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Spinner() {
  return (
    <div
      className="animate-bl-spin rounded-full"
      style={{
        width: 48, height: 48,
        border: '2px solid rgba(255,255,255,0.15)',
        borderTopColor: 'var(--color-accent)',
      }}
    />
  );
}
