
"use client";

import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { materialOptions, type MaterialKey } from "@/lib/materials";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { X, ArrowLeft, ArrowRight, Menu } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "./ui/slider";


export type CustomizationState = {
  colors: {
    [key: string]: string;
  };
  materials: {
    [key: string]: MaterialKey;
  };
};

interface CustomizationPanelProps {
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
                className="w-8 h-8 p-0 border-none appearance-none cursor-pointer bg-transparent rounded-full absolute opacity-0"
            />
            <label htmlFor={id}
                className="w-8 h-8 rounded-full border-2 border-white shadow-md cursor-pointer ring-1 ring-gray-300"
                style={{ backgroundColor: value }}
            >
                <span className="sr-only">Change color</span>
            </label>
        </div>
    );
};


function cleanPartName(name: string): string {
    const match = name.match(/\(([^)]+)\)/);
    if (match && match[1]) {
        return match[1].replace(/_/g, ' ');
    }
    
    const cleanedName = name.split('_').slice(0, 2).join(' ');
    if (cleanedName) return cleanedName;
    
    return name;
}

export default function CustomizationPanel({
  state,
  onStateChange,
}: CustomizationPanelProps) {
  const parts = Object.keys(state.colors);
  const [activePartIndex, setActivePartIndex] = React.useState(0);
  const activePart = parts[activePartIndex];
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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

  const goToNextPart = () => {
    setActivePartIndex((prevIndex) => (prevIndex + 1) % parts.length);
  };

  const goToPrevPart = () => {
    setActivePartIndex((prevIndex) => (prevIndex - 1 + parts.length) % parts.length);
  };


  if (parts.length === 0) {
    return (
        <div className="flex items-center justify-center h-24 p-4 text-muted-foreground">
            <p>Loading customization options...</p>
        </div>
    )
  }

  return (
    <div className="p-4">
        <Collapsible open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <div className="flex items-center justify-between gap-4">
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <CollapsibleTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Menu className="h-4 w-4" />
                                </Button>
                             </CollapsibleTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Menu</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <div className="flex items-center justify-center gap-4">
                  <Button variant="ghost" size="icon" onClick={goToPrevPart}>
                      <ArrowLeft />
                  </Button>
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-2">
                        <p className="font-semibold text-lg capitalize truncate">{cleanPartName(activePart)}</p>
                        <p className="text-sm text-muted-foreground">{activePartIndex + 1}/{parts.length}</p>
                    </div>
                    <ColorSwatch
                        name={activePart}
                        value={state.colors[activePart]}
                        onChange={handleColorChange(activePart)}
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={goToNextPart}>
                      <ArrowRight />
                  </Button>
                </div>


                <div className="w-10 h-10" />
            </div>

            <div className={`overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96' : 'max-h-0'}`}>
                <CollapsibleContent forceMount>
                    <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Material Selector */}
                            <div className="space-y-2">
                                <Label htmlFor={`${activePart}-material`}>Material</Label>
                                <Select
                                    value={state.materials[activePart]}
                                    onValueChange={handleMaterialChange(activePart)}
                                >
                                    <SelectTrigger id={`${activePart}-material`}>
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
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    </div>
  );
}

    
