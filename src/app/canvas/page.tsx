
"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomizationState } from "@/components/customization-panel";
import Header from "@/components/header";

const CosmeticCanvas = dynamic(() => import("@/components/cosmetic-canvas"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[50vh] md:h-full rounded-lg" />,
});

const CustomizationPanel = dynamic(
  () => import("@/components/customization-panel"),
  {
    ssr: false,
    loading: () => <CustomizationPanelSkeleton />,
  }
);

function CustomizationPanelSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}


export default function CanvasPage() {
  const [customization, setCustomization] = useState<CustomizationState>({
    colors: {
      cap: "#C0C0C0",
      body: "#FFFFFF",
      pump: "#808080",
    },
    materials: {
      cap: "glossy",
      body: "glossy",
      pump: "metal-polished",
    },
    background: "#f0f0f0",
  });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 min-h-[50vh] md:min-h-0">
          <Suspense fallback={<Skeleton className="w-full h-full" />}>
            <CosmeticCanvas {...customization} />
          </Suspense>
        </div>
        <div className="md:col-span-1">
           <Suspense fallback={<CustomizationPanelSkeleton />}>
            <CustomizationPanel
              state={customization}
              onStateChange={setCustomization}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
