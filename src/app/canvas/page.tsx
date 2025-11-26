
import { Suspense } from 'react';
import CanvasClient from '@/components/canvas/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function CanvasPage() {
  return (
    <Suspense fallback={<Skeleton className="w-full h-full" />}>
      <CanvasClient />
    </Suspense>
  );
}
