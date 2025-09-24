
"use client";

import { useState, Suspense, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomizationState } from "@/components/customization-panel";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, Environment, CanvasHandle } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Upload, Camera } from "lucide-react";

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

const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };


export default function CanvasPage() {
  const [customization, setCustomization] = useState<CustomizationState>({
    colors: {},
    materials: {},
    logos: {},
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

    partNames.forEach(part => {
        initialMaterials[part] = 'glossy'; // Default to glossy
        initialLogos[part] = null;
    });

    setCustomization(prev => ({
        ...prev,
        colors: initialColors,
        materials: initialMaterials,
        logos: initialLogos,
    }));

    setLoading(false);
  }, []);

  const handleScreenshot = () => {
    canvasRef.current?.takeScreenshot();
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
        <header className="flex items-center justify-between p-4 border-b">
            <div>
                <h1 className="font-semibold text-lg">{product?.name || <Skeleton className="h-6 w-48" />}</h1>
                {product ? (
                    <p className="text-muted-foreground">{formatPrice(product.price)}</p>
                ) : (
                    <div className="text-muted-foreground">
                        <Skeleton className="h-5 w-32 mt-1" />
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                 <Button variant="outline" size="icon" disabled>
                    <Upload className="h-4 w-4" />
                    <span className="sr-only">Share</span>
                </Button>
                <Button onClick={handleScreenshot}>
                    <Camera className="mr-2 h-4 w-4" />
                    Screenshot
                </Button>
            </div>
        </header>

        <main className="flex-1 overflow-hidden">
            <Suspense fallback={<Skeleton className="w-full h-full" />}>
              <CosmeticCanvas 
                ref={canvasRef}
                {...customization} 
                modelURL={product?.modelURL} 
                environmentURL={environment?.fileURL}
                onModelLoad={handleModelLoad}
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
