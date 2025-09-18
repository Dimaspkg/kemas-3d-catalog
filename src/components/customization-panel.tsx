
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { materialOptions, type MaterialKey } from "@/lib/materials";
import { Button } from "./ui/button";

export type CustomizationState = {
  colors: {
    [key: string]: string;
  };
  materials: {
    [key: string]: MaterialKey;
  };
  background: string | null;
};

interface CustomizationPanelProps {
  state: CustomizationState;
  onStateChange: React.Dispatch<React.SetStateAction<CustomizationState>>;
}

const ColorPickerInput = ({ value, onChange }: { value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
    return (
        <div className="relative">
            <input
                type="color"
                value={value}
                onChange={onChange}
                className="w-10 h-10 p-0 border-none appearance-none cursor-pointer bg-transparent rounded-md"
                style={{'--swatch-color': value} as React.CSSProperties}
            />
            <style jsx>{`
                input[type="color"]::-webkit-color-swatch-wrapper {
                    padding: 0;
                }
                input[type="color"]::-webkit-color-swatch {
                    border: 1px solid hsl(var(--border));
                    border-radius: 0.375rem; /* rounded-md */
                }
                input[type="color"]::-moz-color-swatch {
                    border: 1px solid hsl(var(--border));
                    border-radius: 0.375rem; /* rounded-md */
                }
            `}</style>
        </div>
    );
}

export default function CustomizationPanel({
  state,
  onStateChange,
}: CustomizationPanelProps) {
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
  
  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStateChange(prev => ({ ...prev, background: e.target.value }));
  };

  const handleUseEnvironment = () => {
    onStateChange(prev => ({...prev, background: null}));
  }

  const parts = Object.keys(state.colors);

  return (
    <div className="h-full w-full p-4 md:p-8">
        <Card className="h-full shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline">Customize Your Product</CardTitle>
            <CardDescription>
            Adjust colors and materials to create your perfect design.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {parts.map((part, index) => (
            <React.Fragment key={part}>
                <div className="space-y-4">
                <h3 className="text-lg font-semibold font-headline capitalize">{part}</h3>
                <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="space-y-2">
                    <Label htmlFor={`${part}-color`}>Color</Label>
                    <ColorPickerInput
                        value={state.colors[part]}
                        onChange={handleColorChange(part)}
                    />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor={`${part}-material`}>Material</Label>
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
                </div>
                {index < parts.length -1 && <Separator />}
            </React.Fragment>
            ))}
            <Separator />
            <div className="space-y-4">
                <h3 className="text-lg font-semibold font-headline">Environment</h3>
                <div className="flex items-center gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="bg-color">Background Color</Label>
                        <ColorPickerInput
                            value={state.background || '#f9f9f9'}
                            onChange={handleBackgroundChange}
                        />
                    </div>
                    <div className="self-end">
                        <Button variant="outline" onClick={handleUseEnvironment}>Use Environment</Button>
                    </div>
                </div>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
