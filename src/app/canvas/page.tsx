'use client';

import CanvasClient from '@/components/canvas/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

export default function CanvasPage() {
  return (
    <Suspense fallback={<Skeleton className="w-full h-full" />}>
      <CanvasClient />
    </Suspense>
  );
}
