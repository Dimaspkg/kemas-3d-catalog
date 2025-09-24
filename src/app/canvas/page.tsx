
"use client";

import { useState, Suspense, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomizationState } from "@/components/customization-panel";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, Environment, CanvasHandle } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
    <div className="h-24 flex items-center justify-center p-4 md:p-8 border-t bg-card">
        <Skeleton className="h-12 w-full max-w-sm" />
    </div>
  );
}

export default function CanvasPage() {
  const [customization, setCustomization] = useState<CustomizationState>({
    colors: {},
    materials: {},
  });
  const [product, setProduct] = useState<Product | null>(null);
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOpenModel, setShowOpenModel] = useState(false);
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
                const productData = { id: docSnap.id, ...docSnap.data() } as Product;
                setProduct(productData);
                // If the product doesn't have an open model, ensure the switch is off
                if (!productData.modelURLOpen) {
                    setShowOpenModel(false);
                }
            } else {
                console.error("Product not found!");
            }
        }
        
        // We set loading to false here, but the customization panel will wait for the model to load.
        if (!productId) {
            setLoading(false);
        }
    };

    fetchData();
  }, [productId]);

  const handleModelLoad = useCallback((partNames: string[], initialColors: Record<string, string>) => {
    // Only set initial state if it hasn't been set before
    // This prevents customization from being reset when switching models
    setCustomization(prev => {
        const needsInitialization = Object.keys(prev.colors).length === 0;
        if (!needsInitialization) return prev;

        const initialMaterials: { [key: string]: string } = {};
        const newInitialColors: Record<string, string> = {};
        
        partNames.forEach(part => {
            initialMaterials[part] = 'glossy'; // Default to glossy
            newInitialColors[part] = '#000000'; // Default to black
        });

        return {
            colors: newInitialColors,
            materials: initialMaterials,
        };
    });

    setLoading(false);
  }, []);

  const handleScreenshot = () => {
    canvasRef.current?.takeScreenshot();
  };
  
  const currentModelURL = showOpenModel && product?.modelURLOpen ? product.modelURLOpen : product?.modelURL;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
        <main className="flex-1 overflow-hidden relative">
            <Suspense fallback={<Skeleton className="w-full h-full" />}>
              <CosmeticCanvas 
                ref={canvasRef}
                {...customization} 
                product={product}
                modelURL={currentModelURL}
                environmentURL={environment?.fileURL}
                onModelLoad={handleModelLoad}
                onScreenshot={handleScreenshot}
              />
            </Suspense>
            {product?.modelURLOpen && (
                <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/20 backdrop-blur-lg p-2 rounded-lg border border-white/20">
                    <Switch
                        id="open-state-switch"
                        checked={showOpenModel}
                        onCheckedChange={setShowOpenModel}
                        aria-label="Toggle open/closed model view"
                    />
                    <Label htmlFor="open-state-switch" className="text-white text-sm">Show Open State</Label>
                </div>
            )}
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
