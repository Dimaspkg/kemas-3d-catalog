
"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import type { MaterialKey } from "@/lib/materials";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomizationState } from "@/components/customization-panel";
import { ArrowLeft, ArrowRight, Share2, Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { materialOptions, materials } from "@/lib/materials";

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

function CustomHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-lg font-bold">Cosmetic Bottle</h1>
              <p className="text-sm text-muted-foreground">$49.00</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
              <span className="sr-only">Share</span>
            </Button>
            <Button variant="ghost">Done</Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function CustomizationFooter({
  state,
  onStateChange,
}: {
  state: CustomizationState;
  onStateChange: React.Dispatch<React.SetStateAction<CustomizationState>>;
}) {
  const parts: (keyof CustomizationState["colors"])[] = ["cap", "body", "pump"];
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const currentPart = parts[currentPartIndex];

  const nextPart = () => {
    setCurrentPartIndex((prev) => (prev + 1) % parts.length);
  };

  const prevPart = () => {
    setCurrentPartIndex((prev) => (prev - 1 + parts.length) % parts.length);
  };
  
  const handleMaterialChange = (material: MaterialKey) => {
    onStateChange((prev) => ({
      ...prev,
      materials: { ...prev.materials, [currentPart]: material },
    }));
  };

  const handleColorChange = (color: string) => {
      onStateChange(prev => ({
          ...prev,
          colors: { ...prev.colors, [currentPart]: color },
      }));
  }

  const colorPalette = [
    "#000000", "#FFFFFF", "#FF5733", "#33FF57",
    "#3357FF", "#FF33A1", "#F3FF33", "#8D33FF"
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-10 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-28">
            <Button variant="ghost" size="icon">
                <ChevronDown className="h-5 w-5" />
            </Button>
          
            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={prevPart}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-center">
                        <p className="font-semibold capitalize">{currentPart}</p>
                        <p className="text-sm text-muted-foreground">{currentPartIndex + 1}/{parts.length}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={nextPart}>
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    {materialOptions.map((mat) => (
                        <Button
                            key={mat}
                            variant={state.materials[currentPart] === mat ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => handleMaterialChange(mat)}
                            className="capitalize rounded-full"
                        >
                            {mat.replace("-", " ")}
                        </Button>
                    ))}
                </div>
                 <div className="flex items-center gap-2">
                    {colorPalette.map(color => (
                        <button
                            key={color}
                            onClick={() => handleColorChange(color)}
                            className={`w-6 h-6 rounded-full border-2 ${state.colors[currentPart] === color ? 'border-primary' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                        >
                           <span className="sr-only">{color}</span>
                        </button>
                    ))}
                </div>
            </div>

            <Button variant="outline">
                <Menu className="h-5 w-5 mr-2" />
                Menu
            </Button>
        </div>
      </div>
    </footer>
  );
}


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

export default function CustomPage() {
  const [customization, setCustomization] = useState<CustomizationState>({
    colors: {
      cap: "#C0C0C0",
      body: "#FFFFFF",
      pump: "#808080",
    },
    materials: {
      cap: "glossy",
      body: "glossy",
      pump: "metal-polished",
    },
    background: "#f0f0f0", // A light grey background to match the design
  });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <CustomHeader />
      <main className="flex-1 w-full h-full pt-16 pb-28">
          <CosmeticCanvas {...customization} />
      </main>
      <CustomizationFooter state={customization} onStateChange={setCustomization} />
    </div>
  );
}

    