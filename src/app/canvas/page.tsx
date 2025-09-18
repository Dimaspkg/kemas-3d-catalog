
"use client";

import { useState, Suspense, useEffect } from "react";
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
      Base: "#C0C0C0",
      Cover: "#FFFFFF",
      Rod: "#808080",
      Tip: "#C0C0C0",
      Wiper: "#FFFFFF",
    },
    materials: {
      Base: "glossy",
      Cover: "glossy",
      Rod: "metal-polished",
      Tip: "glossy",
      Wiper: "matte",
    },
    background: "#f0f0f0",
  });
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');

  useEffect(() => {
    if (!productId) {
      setLoading(false);
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
        setLoading(false);
    };

    fetchProduct();
  }, [productId]);


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 min-h-[50vh] md:min-h-0">
          <Suspense fallback={<Skeleton className="w-full h-full" />}>
            {loading ? (
              <Skeleton className="w-full h-full rounded-lg" />
            ) : (
              <CosmeticCanvas {...customization} modelURL={product?.modelURL} />
            )}
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
