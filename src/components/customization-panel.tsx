
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
import { materialOptions, type MaterialKey } from "@/lib/materials";
import { ScrollArea } from "./ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cleanPartName } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Brush, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";

export type CustomizationState = {
  colors: {
    [key: string]: string;
  };
  materials: {
    [key: string]: MaterialKey;
  };
};

interface CustomizationPanelProps {
  product: Product;
  state: CustomizationState;
  onStateChange: React.Dispatch<React.SetStateAction<CustomizationState>>;
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
  state,
  onStateChange,
}: CustomizationPanelProps) {
  const parts = Object.keys(state.colors);
  const isMobile = useIsMobile();

  const handleColorChange =
    (part: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onStateChange((prev) => ({
        ...prev,
        colors: { ...prev.colors, [part]: e.target.value },
      }));
    };

  const handleMaterialChange =
    (part: string) => (value: MaterialKey) => {
      onStateChange((prev) => ({
        ...prev,
        materials: { ...prev.materials, [part]: value },
      }));
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
              {materialOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key} className="capitalize">
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
            </div>
            <Separator />
        </div>
        <ScrollArea className="flex-1">
            <div className="p-4 pt-0 space-y-2">
              <Accordion type="single" collapsible className="w-full" defaultValue={parts[0]}>
                  {parts.map(part => (
                      <AccordionItem value={part} key={part} className="bg-card rounded-lg border mb-2">
                          <AccordionTrigger className="px-4 text-sm md:text-base">
                              <span className="truncate" title={cleanPartName(part)}>
                                  {cleanPartName(part)}
                              </span>
                          </AccordionTrigger>
                          <AccordionContent className="border-t">
                              {renderPartControls(part)}
                          </AccordionContent>
                      </AccordionItem>
                  ))}
              </Accordion>
            </div>
        </ScrollArea>
    </div>
  );
}
