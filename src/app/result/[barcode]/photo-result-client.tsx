'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types/product';
import { TopBar } from '@/components/layout/TopBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { getPhotoProduct } from '@/lib/photo-products/storage';
import { ResultClient } from './result-client';

type State =
  | { kind: 'loading' }
  | { kind: 'found'; product: Product }
  | { kind: 'missing' };

export function PhotoResultClient({ id }: { id: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const product = await getPhotoProduct(id);
        if (cancelled) return;
        setState(product ? { kind: 'found', product } : { kind: 'missing' });
      } catch {
        if (!cancelled) setState({ kind: 'missing' });
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (state.kind === 'found') return <ResultClient product={state.product} />;

  return (
    <div className="flex h-screen flex-col bg-bg">
      <TopBar
        onBack={() => router.push('/')}
        title="Photo Result"
        right={<div style={{ width: 36, height: 36 }} />}
      />
      <div className="flex flex-1 items-center justify-center px-5">
        {state.kind === 'loading' ? (
          <div
            className="text-text-dim"
            style={{ fontSize: 13, letterSpacing: '0.04em' }}
          >Loading…</div>
        ) : (
          <EmptyState
            title="Photo result unavailable"
            sub="Photo scans are stored locally on this device and may have been cleared. Take a new photo to scan again."
          />
        )}
      </div>
    </div>
  );
}
