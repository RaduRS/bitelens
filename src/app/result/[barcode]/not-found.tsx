'use client';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="flex h-screen flex-col">
      <TopBar onBack={() => router.push('/')} />
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          title="Product not found"
          sub="We couldn't find this barcode. Try again or scan a different product."
        />
      </div>
    </div>
  );
}
