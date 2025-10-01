
"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cleanPartName } from "@/lib/utils";
import type { Product, Material } from "@/lib/types";
import { Separator } from "./ui/separator";
import Link from "next/link";
import { Button } from "./ui/button";
import { LogOut, Camera, Send } from "lucide-react";

export type CustomizationState = {
  colors: {
    [key: string]: string;
  };
  materials: {
    [key: string]: string; // Material ID
  };
};

interface CustomizationPanelProps {
  product: Product;
  materials: Material[];
  state: CustomizationState;
  onStateChange: React.Dispatch<React.SetStateAction<CustomizationState>>;
  onScreenshot: () => void;
}

const ColorSwatch = ({ value, onChange, name }: { value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, name: string }) => {
    const id = `${name}-color-swatch`;
    return (
        <div className="relative flex items-center">
            <input
                id={id}
                type="color"
                value={value}
                onChange={onChange}
                className="w-8 h-8 p-0 border-none appearance-none cursor-pointer bg-transparent rounded-full absolute opacity-0 z-10"
            />
            <label htmlFor={id}
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer ring-1 ring-gray-300"
                style={{ backgroundColor: value }}
            >
                <span className="sr-only">Change color</span>
            </label>
        </div>
    );
};

export default function CustomizationPanel({
  product,
  materials,
  state,
  onStateChange,
  onScreenshot
}: CustomizationPanelProps) {
  const parts = Object.keys(state.colors);

  const handleColorChange =
    (part: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onStateChange((prev) => ({
        ...prev,
        colors: { ...prev.colors, [part]: e.target.value },
      }));
    };

  const handleMaterialChange =
    (part: string) => (value: string) => {
      onStateChange((prev) => ({
        ...prev,
        materials: { ...prev.materials, [part]: value },
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

  const renderPartControls = (part: string) => (
      <div className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-2">
              <ColorSwatch
                  name={part}
                  value={state.colors[part]}
                  onChange={handleColorChange(part)}
              />
              <Label htmlFor={`${part}-material`} className="sr-only">Material</Label>
          </div>
          <Select
              value={state.materials[part]}
              onValueChange={handleMaterialChange(part)}
          >
              <SelectTrigger id={`${part}-material`} className="flex-grow">
                  <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
              {materials.map((option) => (
                  <SelectItem key={option.id} value={option.id} className="capitalize">
                  {option.name}
                  </SelectItem>
              ))}
              </SelectContent>
          </Select>
      </div>
  )

  return (
    <div className="flex flex-col h-full">
        <div className="p-4 space-y-4">
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
        <ScrollArea className="flex-1">
            <div className="p-4 pt-0 space-y-2">
              <Accordion type="single" collapsible className="w-full" defaultValue={parts[0]}>
                  {parts.map(part => (
                      <AccordionItem value={part} key={part} className="bg-transparent rounded-lg border-0 mb-2">
                          <AccordionTrigger className="px-4 text-sm md:text-base">
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
        <div className="p-4 border-t bg-background space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <Button onClick={onScreenshot} variant="ghost" size="icon">
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
