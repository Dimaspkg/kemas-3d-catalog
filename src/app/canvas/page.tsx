
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
import { Brush, Camera, X, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
  const [isModelLoading, setIsModelLoading] = useState(true);
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
    setIsModelLoading(false);
  }, []);
  
  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsModelLoading(loading);
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
                onLoadingChange={handleLoadingChange}
              />
            </Suspense>
            
            {isModelLoading && <Skeleton className="absolute inset-0 w-full h-full z-10" />}

             <div className="absolute top-4 right-4 flex items-center gap-4 z-20">
               {product?.modelURLOpen && (
                  <Switch
                      id="open-state-switch"
                      checked={showOpenModel}
                      onCheckedChange={setShowOpenModel}
                      aria-label="Toggle open/closed model view"
                  />
              )}
                <Button
                    onClick={handleScreenshot}
                    variant="outline"
                    className="bg-black/20 backdrop-blur-lg border-white/20 text-white hover:bg-black/30"
                >
                    <Camera className="mr-2 h-4 w-4" />
                    Screenshot
                </Button>
                {product?.id ? (
                    <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="bg-black/20 backdrop-blur-lg border-white/20 text-white hover:bg-black/30"
                    >
                        <Link href={`/products/${product.id}`}>
                            <X className="h-4 w-4" />
                        </Link>
                    </Button>
                ) : (
                    <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="bg-black/20 backdrop-blur-lg border-white/20 text-white hover:bg-black/30"
                    >
                        <Link href="/">
                            <X className="h-4 w-4" />
                        </Link>
                    </Button>
                )}
            </div>
            
            <div className="absolute bottom-4 right-4 flex items-center gap-4 z-20">
              {!isMobile && (
                <Button
                    variant="outline"
                    size="icon"
                    className="bg-black/20 backdrop-blur-lg border-white/20 text-white hover:bg-black/30"
                    onClick={() => setIsPanelVisible(!isPanelVisible)}
                    aria-label="Toggle customization panel"
                >
                    <Menu />
                </Button>
              )}
            </div>
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
                <SheetHeader>
                  <SheetTitle className="sr-only">Customization Panel</SheetTitle>
                </SheetHeader>
                <Suspense fallback={<CustomizationPanelSkeleton />}>
                    {customizationPanelContent}
                </Suspense>
            </SheetContent>
          </Sheet>
        ) : (
          <aside className={cn(
              "bg-card border-l shadow-lg z-10 overflow-y-auto transition-all duration-300 ease-in-out",
              isPanelVisible ? "md:w-80 lg:w-96" : "w-0 p-0 border-none"
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

    