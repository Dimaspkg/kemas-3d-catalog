"use client";

import { useState, Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import type { MaterialKey } from "@/lib/materials";
import Header from "@/components/header";
import CosmeticCanvas from "@/components/cosmetic-canvas";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomizationState } from "@/components/customization-panel";

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
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
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


export default function Home() {
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
    background: "#f9f9f9",
    brightness: 1,
  });
  
  const [isClient, setIsClient] = useState(false)
 
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <CustomizationPanelSkeleton />
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 p-4 md:p-8">
        <div className="lg:col-span-2 h-[50vh] lg:h-auto rounded-xl shadow-lg overflow-hidden bg-card">
          <CosmeticCanvas {...customization} />
        </div>
        <div className="lg:col-span-1">
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
