
"use client";

import { useState, Suspense, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, Environment, CanvasHandle, Hotspot, Material } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Info, ChevronLeft, ChevronRight, Gem, Camera, Send, Layers } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cleanPartName } from "@/lib/utils";
import { cn } from "@/lib/utils";

const CosmeticCanvas = dynamic(() => import("@/components/cosmetic-canvas"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

export type CustomizationState = {
  colors: {
    [key: string]: string;
  };
  materials: {
    [key: string]: string; // Material ID
  };
};

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
  const [isPartSelectorOpen, setIsPartSelectorOpen] = useState(false);
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const canvasRef = useRef<CanvasHandle>(null);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);

  const handleModelLoad = useCallback((partNames: string[], initialColors: Record<string, string>) => {
    const uniquePartNames = [...new Set(partNames)];
    const newInitialColors: Record<string, string> = {};
    const newInitialMaterials: { [key: string]: string } = {};
    
    const defaultMaterial = materials.find(m => m.name.toLowerCase() === 'glossy') || materials[0];

    uniquePartNames.forEach(part => {
        newInitialColors[part] = initialColors[part] || '#5C5C5C';
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
  
  const handleMaterialChange = (part: string, materialId: string) => {
      setCustomization((prev) => ({
        ...prev,
        materials: { ...prev.materials, [part]: materialId },
      }));
    };

  const handlePartSelect = (partName: string) => {
    const partIndex = parts.indexOf(partName);
    if (partIndex !== -1) {
        setCurrentPartIndex(partIndex);
    }
    setIsPartSelectorOpen(false);
  };
  
  const groupedMaterials = useMemo(() => {
    const grouped: { [category: string]: Material[] } = {};
    const uncategorized: Material[] = [];

    materials.forEach(material => {
        if (material.categories && material.categories.length > 0) {
            material.categories.forEach(catName => {
                if (!grouped[catName]) {
                    grouped[catName] = [];
                }
                grouped[catName].push(material);
            });
        } else {
            uncategorized.push(material);
        }
    });

    const sortedGrouped: { [category: string]: Material[] } = {};
    materialCategories.forEach(cat => {
        if (grouped[cat.name]) {
            sortedGrouped[cat.name] = grouped[cat.name];
        }
    });
    
    if (uncategorized.length > 0) {
        sortedGrouped['Others'] = uncategorized;
    }

    return sortedGrouped;
  }, [materials, materialCategories]);

    const handleInquiry = () => {
        if (!product) return;
        const whatsAppNumber = "6282340211624";
        let message = `Halo, saya tertarik dengan produk kustom:\n\n`;
        message += `*Produk:* ${product.name}\n`;
        message += `*Kustomisasi:*\n`;

        const materialMap = new Map(materials.map(m => [m.id, m.name]));

        parts.forEach(part => {
            const color = customization.colors[part];
            const materialId = customization.materials[part];
            const materialName = materialMap.get(materialId) || 'Unknown';
            message += `- ${cleanPartName(part)}: Warna ${color}, Material ${materialName}\n`;
        });

        message += `\nMohon informasinya lebih lanjut. Terima kasih.`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsAppNumber}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
    };

  return (
    <>
    <div 
      className="h-screen w-full text-foreground font-body overflow-hidden flex flex-col"
    >
        <main className="relative flex-1 flex items-center justify-center flex-grow">
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
                <Button asChild variant="outline" size="icon" className="bg-background/50 backdrop-blur-sm border-border/30 hover:bg-accent text-foreground">
                    <Link href={product ? `/products/${product.id}` : '/'}>
                        <ChevronLeft className="h-5 w-5" />
                        <span className="sr-only">Exit Customizer</span>
                    </Link>
                </Button>
            </div>

             {/* Product Info & Actions Overlay */}
            {product && (
              <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 max-w-sm">
                 <Card className="bg-background/70 backdrop-blur-sm border-border/30">
                    <CardContent className="p-2">
                        <div className="flex items-center justify-between gap-2">
                            <Button onClick={handleScreenshot} size="sm" variant="outline" className="flex-1 bg-transparent border-input hover:bg-accent text-foreground">
                                <Camera className="mr-2 h-4 w-4" />
                                Screenshot
                            </Button>
                            <Button onClick={handleInquiry} className="flex-1">
                                <Send className="mr-2 h-4 w-4" />
                                Tanya Produk
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-background/70 backdrop-blur-sm border-border/30 text-foreground">
                  <CardHeader>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <CardDescription className="text-foreground/80 pt-1">
                      Sesuaikan setiap bagian dari produk ini.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}


            {/* Quick Controls Overlay */}
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
              {parts.length > 1 && (
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full h-9 bg-background/50 backdrop-blur-sm border text-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setIsPartSelectorOpen(true)}
                >
                    <Layers className="mr-2 h-4 w-4"/>
                    {cleanPartName(currentPartName)}
                </Button>
              )}
              {currentPartName && (
                <>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-full h-9 bg-background/50 backdrop-blur-sm border text-foreground hover:bg-accent hover:text-accent-foreground">
                            <Gem className="mr-2 h-4 w-4"/>
                            Material
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2">
                         <ScrollArea className="h-72">
                            <div className="space-y-4">
                                {Object.entries(groupedMaterials).map(([categoryName, materialsInCategory]) => (
                                    <div key={categoryName} className="space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground px-2">{categoryName}</p>
                                        <div className="flex flex-col gap-1">
                                            {materialsInCategory.map((material) => (
                                                <Button
                                                    key={material.id}
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn(
                                                        "w-full justify-start text-xs",
                                                        customization.materials[currentPartName] === material.id && "bg-accent"
                                                    )}
                                                    onClick={() => handleMaterialChange(currentPartName, material.id)}
                                                >
                                                    {material.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
                <div className="relative h-8 w-8 rounded-full border-2 border-foreground shadow-sm cursor-pointer" style={{ backgroundColor: customization.colors[currentPartName] }}>
                    <label htmlFor="canvas-color-picker" className="block w-full h-full">
                        <span className="sr-only">Change color</span>
                    </label>
                    <input
                        id="canvas-color-picker"
                        type="color"
                        value={customization.colors[currentPartName]}
                        onChange={(e) => handleColorChange(currentPartName, e.target.value)}
                        className="w-full h-full p-0 border-none appearance-none cursor-pointer bg-transparent rounded-full absolute inset-0 opacity-0"
                    />
                </div>
                </>
              )}
            </div>
        </main>
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
    
    <AlertDialog open={isPartSelectorOpen} onOpenChange={setIsPartSelectorOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Select a Part</AlertDialogTitle>
                <AlertDialogDescription>
                    Choose a part of the product to customize.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <ScrollArea className="max-h-60 -mx-6 px-6">
                <div className="flex flex-col gap-2 py-4">
                    {parts.map(part => (
                        <Button
                            key={part}
                            variant={currentPartName === part ? "secondary" : "ghost"}
                            onClick={() => handlePartSelect(part)}
                            className="justify-start"
                        >
                            {cleanPartName(part)}
                        </Button>
                    ))}
                </div>
            </ScrollArea>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
