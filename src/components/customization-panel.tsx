
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
import { Button } from "@/components/ui/button";
import { materialOptions, type MaterialKey } from "@/lib/materials";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";


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
                className="w-10 h-10 p-0 border-none appearance-none cursor-pointer bg-transparent rounded-full absolute opacity-0"
            />
            <label htmlFor={id}
                className="w-10 h-10 rounded-full border-2 border-white shadow-md cursor-pointer ring-1 ring-gray-300"
                style={{ backgroundColor: value }}
            >
                <span className="sr-only">Change color</span>
            </label>
        </div>
    );
};


function cleanPartName(name: string): string {
    const cleanedName = name.replace(/_/g, ' ').replace(/\s\d+$/, '');
    return cleanedName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export default function CustomizationPanel({
  state,
  onStateChange,
}: CustomizationPanelProps) {
  const parts = Object.keys(state.colors);
  const [currentPartIndex, setCurrentPartIndex] = React.useState(0);
  const currentPart = parts[currentPartIndex];

  React.useEffect(() => {
    // Reset index if parts change (e.g. new model loaded)
    setCurrentPartIndex(0);
  }, [parts.length]);

  const goToNextPart = () => {
    setCurrentPartIndex((prev) => (prev + 1) % parts.length);
  };

  const goToPrevPart = () => {
    setCurrentPartIndex((prev) => (prev - 1 + parts.length) % parts.length);
  };

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
        <div className="flex items-center justify-center h-24 p-4 text-muted-foreground">
            <p>Loading customization options...</p>
        </div>
    )
  }

  return (
    <Collapsible className="p-4">
        <div className="grid grid-cols-5 items-center gap-4">
            <div className="col-span-2 flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={goToPrevPart} aria-label="Previous part">
                    <ChevronLeft />
                </Button>
                <Label className="text-lg font-semibold truncate text-center" title={cleanPartName(currentPart)}>
                    {cleanPartName(currentPart)}
                </Label>
                <Button variant="ghost" size="icon" onClick={goToNextPart} aria-label="Next part">
                    <ChevronRight />
                </Button>
            </div>
            <div className="col-span-1 flex justify-center">
                <ColorSwatch
                    name={currentPart}
                    value={state.colors[currentPart]}
                    onChange={handleColorChange(currentPart)}
                />
            </div>
             <div className="col-span-2 flex items-center justify-end gap-2">
                <Select
                    value={state.materials[currentPart]}
                    onValueChange={handleMaterialChange(currentPart)}
                >
                    <SelectTrigger id={`${currentPart}-material`} className="w-[180px]">
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
                 <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu />
                        <span className="sr-only">Toggle materials</span>
                    </Button>
                </CollapsibleTrigger>
            </div>
        </div>

         <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {parts.map(part => (
                    <div key={part} className="p-2 rounded-lg border flex flex-col items-center gap-2">
                        <Label className="text-sm truncate" title={cleanPartName(part)}>{cleanPartName(part)}</Label>
                        <div className="flex items-center gap-4">
                             <ColorSwatch
                                name={`${part}-all`}
                                value={state.colors[part]}
                                onChange={handleColorChange(part)}
                            />
                            <Select
                                value={state.materials[part]}
                                onValueChange={handleMaterialChange(part)}
                            >
                                <SelectTrigger id={`${part}-material-all`} className="w-[120px]">
                                    <SelectValue placeholder="Material" />
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
                ))}
            </div>
        </CollapsibleContent>
    </Collapsible>
  );
}
