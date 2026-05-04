'use client';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { Scanner } from '@/components/barcode/Scanner';

export default function BarcodePage() {
  const router = useRouter();
  return (
    <div className="relative h-screen">
      <div className="absolute inset-0 z-10">
        <TopBar onBack={() => router.push('/')} />
      </div>
      <Scanner />
    </div>
  );
}
