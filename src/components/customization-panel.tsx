
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
import { materialOptions, type MaterialKey } from "@/lib/materials";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// Function to clean up part names
function cleanPartName(name: string): string {
    const match = name.match(/\(([^)]+)\)/);
    if (match && match[1]) {
        return match[1].replace(/_/g, ' ');
    }
    
    // Fallback for names like Spring_pin_150_x_10001
    const cleanedName = name.split('_').slice(0, 2).join(' ');
    if (cleanedName) return cleanedName;
    
    return name;
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
  
  const parts = Object.keys(state.colors);
  const TABS_ID = React.useId();


  if (parts.length === 0) {
    return (
      <div className="h-full w-full p-4 md:p-8">
        <Card className="h-full shadow-lg rounded-lg border-0">
          <CardHeader>
              <CardTitle className="font-headline">Customize Your Product</CardTitle>
              <CardDescription>
                Load a product to start customizing.
              </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No customizable parts found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
        <Card className="shadow-lg rounded-lg border-0">
        <CardHeader>
            <CardTitle className="font-headline">Customize Your Product</CardTitle>
            <CardDescription>
            Select a part and adjust colors and materials to create your perfect design.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={parts[0]} className="w-full">
            <TabsList>
              {parts.map(part => (
                <TabsTrigger key={`${TABS_ID}-${part}`} value={part} className="capitalize">{cleanPartName(part)}</TabsTrigger>
              ))}
            </TabsList>
            
            {parts.map((part) => (
              <TabsContent key={`${TABS_ID}-${part}-content`} value={part}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-4">
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
                          <SelectTrigger id={`${part}-material`} className="max-w-xs">
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
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        </Card>
    </div>
  );
}
