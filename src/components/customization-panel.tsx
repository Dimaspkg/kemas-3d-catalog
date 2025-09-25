
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
import { Button } from "./ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";


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

  React.useEffect(() => {
    if (activePartIndex >= parts.length && parts.length > 0) {
      setActivePartIndex(0);
    }
  }, [parts, activePartIndex]);

  if (parts.length === 0) {
    return (
        <div className="flex items-center justify-center h-24 p-4 text-muted-foreground">
            <p>Loading customization options...</p>
        </div>
    )
  }

  return (
    <div className="p-4 h-24 flex items-center justify-center">
        <div className="flex w-full items-center justify-between gap-4 md:gap-8">
            
            {/* Part Navigation */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={goToPrevPart} aria-label="Previous Part">
                    <ArrowLeft />
                </Button>
                <div className="flex items-baseline gap-2 text-center w-24 sm:w-32 md:w-40">
                    <p className="font-semibold text-lg capitalize truncate" title={cleanPartName(activePart)}>{cleanPartName(activePart)}</p>
                    <p className="text-sm text-muted-foreground flex-shrink-0">{activePartIndex + 1}/{parts.length}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={goToNextPart} aria-label="Next Part">
                    <ArrowRight />
                </Button>
            </div>

            {/* Customization Controls */}
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-1">
                     <Label htmlFor={`${activePart}-color-swatch`} className="text-xs text-muted-foreground">Color</Label>
                    <ColorSwatch
                        name={activePart}
                        value={state.colors[activePart]}
                        onChange={handleColorChange(activePart)}
                    />
                </div>
                
                <div className="flex flex-col gap-1 w-32 md:w-40">
                    <Label htmlFor={`${activePart}-material`} className="text-xs text-muted-foreground">Material</Label>
                    <Select
                        value={state.materials[activePart]}
                        onValueChange={handleMaterialChange(activePart)}
                    >
                        <SelectTrigger id={`${activePart}-material`} className="h-8">
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
    </div>
  );
}

