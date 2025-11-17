
"use client";

import { useState, Suspense, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomizationState } from "@/components/customization-panel";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, Environment, CanvasHandle, Hotspot, Material } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Info, ChevronLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="p-8 space-y-6 h-full flex flex-col justify-center">
        <Skeleton className="h-8 w-1/3" />
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    </div>
  );
}

interface MaterialCategory {
  id: string;
  name: string;
}

export default function CanvasClient() {
  const [customization, setCustomization] = useState<CustomizationState>({
    colors: {},
    materials: {},
  });
  const [product, setProduct] = useState<Product | null>(null);
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialCategories, setMaterialCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [showOpenModel, setShowOpenModel] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const canvasRef = useRef<CanvasHandle>(null);
  const isMobile = useIsMobile();
  const [currentPartIndex, setCurrentPartIndex] = useState(0);

  const handleModelLoad = useCallback((partNames: string[], initialColors: Record<string, string>) => {
    const uniquePartNames = [...new Set(partNames)];
    const newInitialColors: Record<string, string> = {};
    const newInitialMaterials: { [key: string]: string } = {};
    
    const defaultMaterial = materials.find(m => m.name.toLowerCase() === 'glossy') || materials[0];

    uniquePartNames.forEach(part => {
        newInitialColors[part] = initialColors[part] || '#000000';
        newInitialMaterials[part] = defaultMaterial?.id || '';
    });

    setCustomization({
        colors: newInitialColors,
        materials: newInitialMaterials,
    });
    setLoading(false);
    setIsModelLoading(false);
  }, [materials]);
  
  useEffect(() => {
    const fetchStaticData = async () => {
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
    };
    
    setLoading(true);
    fetchStaticData();

    const materialsQuery = query(collection(db, 'materials'), orderBy('createdAt', 'asc'));
    const unsubscribeMaterials = onSnapshot(materialsQuery, (snapshot) => {
        const materialsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material));
        setMaterials(materialsData);
    });

    const materialCategoriesQuery = query(collection(db, 'materialCategories'), orderBy('name', 'asc'));
    const unsubscribeMaterialCategories = onSnapshot(materialCategoriesQuery, (snapshot) => {
        const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaterialCategory));
        setMaterialCategories(categoriesData);
    });
    
    if (!productId) {
        setLoading(false);
    }
    
    return () => {
        unsubscribeMaterials();
        unsubscribeMaterialCategories();
    }
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

  const parts = Object.keys(customization.colors);
  const currentPartName = parts[currentPartIndex];

  const handleColorChange = (part: string, newValue: string) => {
    setCustomization((prev) => ({
      ...prev,
      colors: { ...prev.colors, [part]: newValue },
    }));
  };

  const customizationPanelContent = (
    loading || !product || materials.length === 0 ? (
      <CustomizationPanelSkeleton />
    ) : (
      <CustomizationPanel
        product={product}
        materials={materials}
        materialCategories={materialCategories}
        state={customization}
        onStateChange={setCustomization}
        onScreenshot={handleScreenshot}
        currentPartIndex={currentPartIndex}
        onPartChange={setCurrentPartIndex}
      />
    )
  );

  return (
    <>
    <div 
      className="h-screen w-full text-foreground font-body overflow-hidden flex md:flex-row flex-col"
      style={{ background: '#333333' }}
    >
        <main className="relative flex-1 flex items-center justify-center flex-grow h-[60vh] md:h-full">
            <Suspense fallback={<Skeleton className="w-full h-full" />}>
              <div className="relative w-full h-full">
                <CosmeticCanvas 
                  ref={canvasRef}
                  {...customization} 
                  materialsData={materials}
                  product={product}
                  modelURL={showOpenModel && product?.modelURLOpen ? product.modelURLOpen : product?.modelURL}
                  environmentURL={environment?.fileURL}
                  onModelLoad={handleModelLoad}
                  onLoadingChange={handleLoadingChange}
                  onHotspotClick={handleHotspotClick}
                  activePart={currentPartName}
                />
              </div>
            </Suspense>
            
            {isModelLoading && <Skeleton className="absolute inset-0 w-full h-full z-10" />}

            {/* Back Button */}
            <div className="absolute top-4 left-4 z-20">
                <Button asChild variant="outline" size="icon">
                    <Link href={product ? `/products/${product.id}` : '/'}>
                        <ChevronLeft className="h-5 w-5" />
                        <span className="sr-only">Exit Customizer</span>
                    </Link>
                </Button>
            </div>

             {/* Product Info Overlay */}
            {product && (
              <div className="absolute bottom-4 left-4 z-20 max-w-sm">
                <Card className="bg-background/70 backdrop-blur-sm border-white/20 text-foreground">
                  <CardHeader>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <CardDescription className="text-foreground/80 pt-1">
                      Sesuaikan setiap bagian dari produk ini.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}


            {/* Common UI Elements */}
             <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-20">
               {product?.modelURLOpen && (
                 <div>
                    <Switch
                        id="open-state-switch"
                        checked={showOpenModel}
                        onCheckedChange={setShowOpenModel}
                        aria-label="Toggle open/closed model view"
                    />
                 </div>
              )}
              {currentPartName && (
                <div className="flex items-center text-foreground rounded-full p-1 bg-background/50 backdrop-blur-sm border">
                    <div className="relative flex items-center">
                        <input
                            id="canvas-color-picker"
                            type="color"
                            value={customization.colors[currentPartName]}
                            onChange={(e) => handleColorChange(currentPartName, e.target.value)}
                            className="w-8 h-8 p-0 border-none appearance-none cursor-pointer bg-transparent rounded-full absolute opacity-0 z-10"
                        />
                        <label
                            htmlFor="canvas-color-picker"
                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer ring-1 ring-gray-300"
                            style={{ backgroundColor: customization.colors[currentPartName] }}
                        >
                            <span className="sr-only">Change color</span>
                        </label>
                    </div>
                </div>
              )}
            </div>
        </main>

        <aside className="h-[40vh] md:h-full flex-shrink-0 border-t md:border-t-0 md:border-l md:w-[400px] overflow-y-auto">
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
