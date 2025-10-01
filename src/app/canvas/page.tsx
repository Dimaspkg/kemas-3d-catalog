
"use client";

import { useState, Suspense, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomizationState } from "@/components/customization-panel";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, Environment, CanvasHandle, Hotspot } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Camera, X, Menu, ChevronLeft, ChevronRight, LogOut, Info, Brush } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { cleanPartName } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

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
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const canvasRef = useRef<CanvasHandle>(null);
  const isMobile = useIsMobile();

  const handleModelLoad = useCallback((partNames: string[], initialColors: Record<string, string>) => {
    const uniquePartNames = [...new Set(partNames)];
    const newInitialColors: Record<string, string> = {};
    const newInitialMaterials: { [key: string]: string } = {};

    uniquePartNames.forEach(part => {
        newInitialColors[part] = initialColors[part] || '#000000';
        newInitialMaterials[part] = 'glossy'; 
    });

    setCustomization({
        colors: newInitialColors,
        materials: newInitialMaterials,
    });
    setLoading(false);
    setIsModelLoading(false);
  }, []);
  
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
  
  const handleLoadingChange = useCallback((loading: boolean) => {
    if(loading !== isModelLoading) {
      setIsModelLoading(loading);
    }
  }, [isModelLoading]);

  const handleScreenshot = () => {
    canvasRef.current?.takeScreenshot();
  };
  
  const handleHotspotClick = useCallback((hotspot: Hotspot) => {
    setActiveHotspot(hotspot);
  }, []);

  const currentModelURL = showOpenModel && product?.modelURLOpen ? product.modelURLOpen : product?.modelURL;

  const customizationPanelContent = (
    loading || !product ? (
      <CustomizationPanelSkeleton />
    ) : (
      <CustomizationPanel
        product={product}
        state={customization}
        onStateChange={setCustomization}
      />
    )
  );

  return (
    <>
    <div className={cn("h-screen w-full bg-background text-foreground font-body overflow-hidden flex flex-row md:grid md:grid-cols-5")}>
        <main className={cn("relative flex-1 md:flex-initial w-3/5 md:w-auto md:col-span-3")}>
            <Suspense fallback={<Skeleton className="w-full h-full" />}>
              <div className="relative w-full h-full md:h-full md:aspect-auto">
                <CosmeticCanvas 
                  ref={canvasRef}
                  {...customization} 
                  product={product}
                  modelURL={currentModelURL}
                  environmentURL={environment?.fileURL}
                  onModelLoad={handleModelLoad}
                  onLoadingChange={handleLoadingChange}
                  onHotspotClick={handleHotspotClick}
                />
              </div>
            </Suspense>
            
            {isModelLoading && <Skeleton className="absolute inset-0 w-full h-full z-10" />}

            {/* Common UI Elements */}
             <div className={cn("absolute top-4 right-4 flex items-center gap-2 z-20")}>
               {product?.modelURLOpen && (
                  <Switch
                      id="open-state-switch"
                      checked={showOpenModel}
                      onCheckedChange={setShowOpenModel}
                      aria-label="Toggle open/closed model view"
                      size="sm"
                  />
              )}
                <Button
                    onClick={handleScreenshot}
                    variant="outline"
                    size="sm"
                    className="bg-black/20 backdrop-blur-lg border-white/20 text-white hover:bg-black/30"
                >
                    <Camera className="mr-2 h-4 w-4" />
                    <span className="hidden md:inline">Screenshot</span>
                </Button>
            </div>
            
            <div className="absolute top-4 left-4 z-20">
                <Button
                    asChild
                    variant="outline"
                    size="icon"
                    className="bg-black/20 backdrop-blur-lg border-white/20 text-white hover:bg-black/30 rounded-full"
                >
                    <Link href={product ? `/products/${product.id}`: '/products'}>
                        <X className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
        </main>

        {/* Customization Panel */}
        <aside className={cn("h-full overflow-y-auto w-2/5 md:w-auto md:col-span-2")}>
            <Suspense fallback={<CustomizationPanelSkeleton />}>
                {customizationPanelContent}
            </Suspense>
        </aside>
    </div>

    {activeHotspot && (
      <AlertDialog open={!!activeHotspot} onOpenChange={() => setActiveHotspot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              {activeHotspot.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-4">
              {activeHotspot.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setActiveHotspot(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}
    </>
  );
}
