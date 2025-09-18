
"use client";

import { useState, Suspense, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomizationState } from "@/components/customization-panel";
import Header from "@/components/header";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/lib/types";

const CosmeticCanvas = dynamic(() => import("@/components/cosmetic-canvas"), {
  ssr: false,
  loading: () => <Skeleton className="w-full aspect-[12/5] rounded-lg" />,
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
    <div className="p-4 md:p-8">
      <div className="h-full shadow-lg rounded-lg p-6 space-y-6 bg-card">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}


export default function CanvasPage() {
  const [customization, setCustomization] = useState<CustomizationState>({
    colors: {},
    materials: {},
    background: "#f0f0f0",
  });
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      // If no product ID, we could load a default model or show a message
      return;
    }

    const fetchProduct = async () => {
        setLoading(true);
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        } else {
            console.error("Product not found!");
        }
        // Loading will be set to false inside onModelLoad to ensure state is ready
    };

    fetchProduct();
  }, [productId]);

  const handleModelLoad = useCallback((partNames: string[]) => {
    console.log("Discovered parts:", partNames);
    const initialColors: { [key: string]: string } = {};
    const initialMaterials: { [key: string]: string } = {};

    partNames.forEach(part => {
        initialColors[part] = '#C0C0C0'; // Default to silver
        initialMaterials[part] = 'glossy'; // Default to glossy
    });

    setCustomization(prev => ({
        ...prev,
        colors: initialColors,
        materials: initialMaterials,
    }));

    setLoading(false);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="w-full max-w-7xl mx-auto">
          <div className="w-full aspect-[12/5]">
            <Suspense fallback={<Skeleton className="w-full h-full" />}>
              <CosmeticCanvas 
                {...customization} 
                modelURL={product?.modelURL} 
                onModelLoad={handleModelLoad}
              />
            </Suspense>
          </div>
        </div>
        <div className="flex-grow">
           <Suspense fallback={<CustomizationPanelSkeleton />}>
            {loading ? (
                <CustomizationPanelSkeleton />
            ) : (
                <CustomizationPanel
                state={customization}
                onStateChange={setCustomization}
                />
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
}

