
"use client";

import { useState, Suspense, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomizationState } from "@/components/customization-panel";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, Environment } from "@/lib/types";

const CosmeticCanvas = dynamic(() => import("@/components/cosmetic-canvas"), {
  ssr: false,
  loading: () => <Skeleton className="w-full aspect-[192/65] rounded-lg" />,
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
    backgroundColor: "#f5f5f5", // Default background color
  });
  const [product, setProduct] = useState<Product | null>(null);
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);

        // Fetch active environment
        const envQuery = query(collection(db, 'environments'), where("isActive", "==", true));
        const envSnapshot = await getDocs(envQuery);
        if (!envSnapshot.empty) {
            setEnvironment(envSnapshot.docs[0].data() as Environment);
        }

        // Fetch product if ID exists
        if (productId) {
            const docRef = doc(db, 'products', productId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
            } else {
                console.error("Product not found!");
            }
        }
        // Loading will be set to false inside onModelLoad to ensure state is ready,
        // or if there's no product ID
        if (!productId) {
            setLoading(false);
        }
    };

    fetchData();
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
      <main className="flex-1 flex flex-col">
        <div className="w-full">
          <div className="w-full aspect-[192/65]">
            <Suspense fallback={<Skeleton className="w-full h-full" />}>
              <CosmeticCanvas 
                {...customization} 
                modelURL={product?.modelURL} 
                environmentURL={environment?.fileURL}
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
