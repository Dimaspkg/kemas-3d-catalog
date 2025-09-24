
"use client";

import { useState, Suspense, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomizationState } from "@/components/customization-panel";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, Environment, CanvasHandle } from "@/lib/types";

const CosmeticCanvas = dynamic(() => import("@/components/cosmetic-canvas"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
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
    <div className="h-full flex items-center justify-center p-4 md:p-8 border-t bg-card">
        <Skeleton className="h-12 w-full max-w-sm" />
    </div>
  );
}

export default function CanvasPage() {
  const [customization, setCustomization] = useState<CustomizationState>({
    colors: {},
    materials: {},
    logos: {},
    logoSizes: {},
  });
  const [product, setProduct] = useState<Product | null>(null);
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const canvasRef = useRef<CanvasHandle>(null);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);

        // Fetch active environment
        const envQuery = query(collection(db, 'environments'), where("isActive", "==", true));
        const envSnapshot = await getDocs(envQuery);
        if (!envSnapshot.empty) {
            setEnvironment(envSnapshot.docs[0].data() as Environment);
        } else {
             console.warn("No active environment found. Falling back to default.");
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
        
        if (!productId) {
            setLoading(false);
        }
    };

    fetchData();
  }, [productId]);

  const handleModelLoad = useCallback((partNames: string[], initialColors: Record<string, string>) => {
    const initialMaterials: { [key: string]: string } = {};
    const initialLogos: { [key: string]: string | null } = {};
    const initialLogoSizes: { [key: string]: number } = {};

    partNames.forEach(part => {
        initialMaterials[part] = 'glossy'; // Default to glossy
        initialLogos[part] = null;
        initialLogoSizes[part] = 1;
    });

    setCustomization(prev => ({
        ...prev,
        colors: initialColors,
        materials: initialMaterials,
        logos: initialLogos,
        logoSizes: initialLogoSizes,
    }));

    setLoading(false);
  }, []);

  const handleScreenshot = () => {
    canvasRef.current?.takeScreenshot();
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
        <main className="flex-1 overflow-hidden">
            <Suspense fallback={<Skeleton className="w-full h-full" />}>
              <CosmeticCanvas 
                ref={canvasRef}
                {...customization} 
                product={product}
                modelURL={product?.modelURL} 
                environmentURL={environment?.fileURL}
                onModelLoad={handleModelLoad}
                onScreenshot={handleScreenshot}
              />
            </Suspense>
        </main>
        
        <footer className="w-full border-t bg-card">
           <Suspense fallback={<CustomizationPanelSkeleton />}>
            {loading || !product ? (
                <CustomizationPanelSkeleton />
            ) : (
                <CustomizationPanel
                    state={customization}
                    onStateChange={setCustomization}
                />
            )}
          </Suspense>
        </footer>
    </div>
  );
}
