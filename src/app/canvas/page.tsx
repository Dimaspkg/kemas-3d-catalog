
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
import { Button } from "@/components/ui/button";
import { PanelRightOpen, PanelRightClose, Brush } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
    <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
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
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const canvasRef = useRef<CanvasHandle>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setIsPanelVisible(false);
    } else {
      setIsPanelVisible(true);
    }
  }, [isMobile]);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);

        const envQuery = query(collection(db, 'environments'), where("isActive", "==", true));
        const envSnapshot = await getDocs(envQuery);
        if (!envSnapshot.empty) {
            setEnvironment(envSnapshot.docs[0].data() as Environment);
        }

        if (productId) {
            const docRef = doc(db, 'products', productId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const productData = { id: docSnap.id, ...docSnap.data() } as Product;
                setProduct(productData);
                if (!productData.modelURLOpen) {
                    setShowOpenModel(false);
                }
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
    setCustomization(prev => {
        const uniquePartNames = [...new Set(partNames)];
        const needsInitialization = Object.keys(prev.colors).length === 0 || JSON.stringify(Object.keys(prev.colors).sort()) !== JSON.stringify(uniquePartNames.sort());
        if (!needsInitialization) return prev;

        const newInitialColors: Record<string, string> = {};
        const newInitialMaterials: { [key: string]: string } = {};

        uniquePartNames.forEach(part => {
            newInitialColors[part] = initialColors[part] || '#000000';
            newInitialMaterials[part] = 'glossy'; 
        });

        return {
            colors: newInitialColors,
            materials: newInitialMaterials,
        };
    });
    setLoading(false);
  }, []);

  const handleScreenshot = () => {
    canvasRef.current?.takeScreenshot();
  };
  
  const currentModelURL = showOpenModel && product?.modelURLOpen ? product.modelURLOpen : product?.modelURL;

  const customizationPanelContent = (
    loading || !product ? (
      <CustomizationPanelSkeleton />
    ) : (
      <CustomizationPanel
        state={customization}
        onStateChange={setCustomization}
      />
    )
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground font-body">
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
            {!isMobile && (
              <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-4 right-4 bg-black/20 backdrop-blur-lg border-white/20 text-white hover:bg-black/30"
                  onClick={() => setIsPanelVisible(!isPanelVisible)}
                  aria-label="Toggle customization panel"
              >
                  {isPanelVisible ? <PanelRightClose /> : <PanelRightOpen />}
              </Button>
            )}
        </main>

        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
                <Button className="fixed bottom-4 left-1/2 -translate-x-1/2 w-48 z-20" size="lg">
                    <Brush className="mr-2 h-5 w-5" />
                    Customize
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[75vh] p-0">
                <Suspense fallback={<CustomizationPanelSkeleton />}>
                    {customizationPanelContent}
                </Suspense>
            </SheetContent>
          </Sheet>
        ) : (
          <aside className={cn(
              "bg-card border-l shadow-lg z-10 overflow-y-auto transition-all duration-300 ease-in-out",
              isPanelVisible ? "w-96" : "w-0 p-0 border-none"
          )}>
            <Suspense fallback={<CustomizationPanelSkeleton />}>
                <div className={cn(!isPanelVisible && "hidden")}>
                  {customizationPanelContent}
                </div>
            </Suspense>
          </aside>
        )}
    </div>
  );
}
