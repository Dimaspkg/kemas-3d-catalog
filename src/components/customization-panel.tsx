
"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cleanPartName } from "@/lib/utils";
import type { Product, Material } from "@/lib/types";
import { Separator } from "./ui/separator";
import Link from "next/link";
import { Button } from "./ui/button";
import { LogOut, Camera, Send } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";

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

interface CustomizationPanelProps {
  product: Product;
  materials: Material[];
  materialCategories: MaterialCategory[];
  state: CustomizationState;
  onStateChange: React.Dispatch<React.SetStateAction<CustomizationState>>;
  onScreenshot: () => void;
}

const ColorSwatch = ({ value, onChange, name }: { value: string, onChange: (newValue: string) => void, name: string }) => {
    const id = `${name}-color-swatch`;
    const [textValue, setTextValue] = React.useState(value);

    React.useEffect(() => {
        setTextValue(value);
    }, [value]);

    const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTextValue(e.target.value);
        // Basic validation for hex color format
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
            onChange(e.target.value);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <div className="relative flex items-center">
                <input
                    id={id}
                    type="color"
                    value={value}
                    onChange={handleColorInputChange}
                    className="w-8 h-8 p-0 border-none appearance-none cursor-pointer bg-transparent rounded-full absolute opacity-0 z-10"
                />
                <label htmlFor={id}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer ring-1 ring-gray-300"
                    style={{ backgroundColor: value }}
                >
                    <span className="sr-only">Change color</span>
                </label>
            </div>
            <Input
                type="text"
                value={textValue}
                onChange={handleTextInputChange}
                className="w-24 h-8 text-sm font-mono"
                maxLength={7}
            />
        </div>
    );
};

export default function CustomizationPanel({
  product,
  materials,
  materialCategories,
  state,
  onStateChange,
  onScreenshot
}: CustomizationPanelProps) {
  const parts = Object.keys(state.colors);

  const handleColorChange =
    (part: string) =>
    (newValue: string) => {
      onStateChange((prev) => ({
        ...prev,
        colors: { ...prev.colors, [part]: newValue },
      }));
    };

  const handleMaterialChange =
    (part: string, materialId: string) => {
      onStateChange((prev) => ({
        ...prev,
        materials: { ...prev.materials, [part]: materialId },
      }));
    };

    const handleInquiry = () => {
        const whatsAppNumber = "6282340211624";
        let message = `Halo, saya tertarik dengan produk kustom:\n\n`;
        message += `*Produk:* ${product.name}\n`;
        message += `*Kustomisasi:*\n`;

        const materialMap = new Map(materials.map(m => [m.id, m.name]));

        parts.forEach(part => {
            const color = state.colors[part];
            const materialId = state.materials[part];
            const materialName = materialMap.get(materialId) || 'Unknown';
            message += `- ${cleanPartName(part)}: Warna ${color}, Material ${materialName}\n`;
        });

        message += `\nMohon informasinya lebih lanjut. Terima kasih.`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsAppNumber}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
    };

  if (parts.length === 0) {
    return (
        <div className="flex items-center justify-center h-full p-4 text-muted-foreground">
            <p>Loading customization options...</p>
        </div>
    )
  }

  const groupedMaterials = React.useMemo(() => {
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

  const renderPartControls = (part: string) => (
      <div className="space-y-4 p-1">
          <div className="flex items-center justify-between gap-4 px-3">
              <p className="text-sm font-medium">Color</p>
              <ColorSwatch
                  name={part}
                  value={state.colors[part]}
                  onChange={handleColorChange(part)}
              />
          </div>
          
          <div className="space-y-3">
            {Object.entries(groupedMaterials).map(([categoryName, materialsInCategory]) => (
                <div key={categoryName} className="space-y-2">
                    <Label className="px-3 text-xs text-muted-foreground font-medium">{categoryName}</Label>
                    <Carousel
                        opts={{
                            align: "start",
                            dragFree: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-2">
                            {materialsInCategory.map((material) => (
                                <CarouselItem key={material.id} className="pl-2 basis-auto">
                                    <div className="p-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                "h-auto py-2 px-4 whitespace-normal",
                                                state.materials[part] === material.id && "ring-2 ring-primary"
                                            )}
                                            onClick={() => handleMaterialChange(part, material.id)}
                                        >
                                            {material.name}
                                        </Button>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex" />
                        <CarouselNext className="hidden md:flex" />
                    </Carousel>
                </div>
            ))}
          </div>

      </div>
  )

  return (
    <div className="flex flex-col h-full">
        <div className="p-4 space-y-4 bg-background">
            <div className="px-2 flex justify-between items-center">
                 <div>
                    <h2 className="text-xl md:text-2xl font-bold">{product.name}</h2>
                    <p className="text-xs md:text-sm text-muted-foreground">Customize your product</p>
                </div>
                <Button asChild variant="ghost" size="icon" className="hidden md:inline-flex">
                    <Link href={`/products/${product.id}`}>
                        <LogOut className="h-5 w-5" />
                        <span className="sr-only">Exit Customizer</span>
                    </Link>
                </Button>
            </div>
            <Separator />
        </div>
        <ScrollArea className="flex-1 bg-background">
            <div className="p-4 pt-0 space-y-2">
              <Accordion type="single" collapsible className="w-full" defaultValue={parts[0]}>
                  {parts.map(part => (
                      <AccordionItem value={part} key={part} className="bg-transparent rounded-lg border-0 mb-2">
                          <AccordionTrigger className="px-4 text-sm md:text-base hover:no-underline">
                              <span className="truncate" title={cleanPartName(part)}>
                                  {cleanPartName(part)}
                              </span>
                          </AccordionTrigger>
                          <AccordionContent>
                              {renderPartControls(part)}
                          </AccordionContent>
                      </AccordionItem>
                  ))}
              </Accordion>
            </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <Button onClick={onScreenshot} variant="outline" size="icon">
                        <Camera className="h-5 w-5" />
                        <span className="sr-only">Screenshot</span>
                    </Button>
                </div>
                 <Button onClick={handleInquiry} className="flex-grow">
                    <Send className="mr-2 h-4 w-4" />
                    Tanya Produk
                </Button>
            </div>
        </div>
    </div>
  );
}
