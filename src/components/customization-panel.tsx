
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

  return (
    <ScrollArea className="h-full w-full py-4">
        <div className="space-y-4">
            {parts.map(part => (
                 <div key={part} className="grid grid-cols-5 items-center gap-4 px-4">
                    <Label className="col-span-2 truncate capitalize" title={cleanPartName(part)}>{cleanPartName(part)}</Label>
                    <div className="col-span-1 flex justify-center">
                        <ColorSwatch
                            name={part}
                            value={state.colors[part]}
                            onChange={handleColorChange(part)}
                        />
                    </div>
                    <div className="col-span-2">
                        <Select
                            value={state.materials[part]}
                            onValueChange={handleMaterialChange(part)}
                        >
                            <SelectTrigger id={`${part}-material`}>
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
            ))}
        </div>
    </ScrollArea>
  );
}
