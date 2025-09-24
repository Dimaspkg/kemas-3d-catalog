
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
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
  } from "@/components/ui/carousel"
import { cn } from "@/lib/utils";

export type CustomizationState = {
  colors: {
    [key: string]: string;
  };
  materials: {
    [key: string]: MaterialKey;
  };
  logos: {
    [key: string]: string | null;
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
  const [activePart, setActivePart] = React.useState<string | null>(parts[0] || null);

  React.useEffect(() => {
    if (!activePart && parts.length > 0) {
      setActivePart(parts[0]);
    }
  }, [parts, activePart]);

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

  const handleLogoChange = 
    (part: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                onStateChange((prev) => ({
                    ...prev,
                    logos: { ...prev.logos, [part]: dataUrl },
                }));
            };
            reader.readAsDataURL(file);
        }
    };

  const handleRemoveLogo = (part: string) => () => {
    onStateChange((prev) => ({
      ...prev,
      logos: { ...prev.logos, [part]: null },
    }));
  };

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
    <div className="p-4 md:p-8 space-y-6">
        <div className="space-y-2">
            <h2 className="text-xl font-headline font-semibold">Select Part</h2>
            <p className="text-sm text-muted-foreground">
                Choose a product part to customize from the options below.
            </p>
        </div>
        <Carousel
            opts={{
                align: "start",
                dragFree: true,
            }}
            className="w-full"
        >
            <CarouselContent>
                {parts.map((part) => (
                <CarouselItem key={part} className="basis-auto">
                    <Button
                        variant={activePart === part ? "default" : "outline"}
                        onClick={() => setActivePart(part)}
                        className="capitalize"
                    >
                        {cleanPartName(part)}
                    </Button>
                </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
        </Carousel>

        <Card className="shadow-lg rounded-lg border-0">
        <CardContent className="pt-6">
            {activePart && (
              <div>
                 <h3 className="capitalize text-lg font-semibold font-headline mb-4">
                    Customizing: {cleanPartName(activePart)}
                 </h3>
                 <Tabs defaultValue="color-material" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="color-material">Appearance</TabsTrigger>
                      <TabsTrigger value="logo">Logo</TabsTrigger>
                    </TabsList>
                    <TabsContent value="color-material">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-4">
                            <div className="space-y-2">
                                <Label htmlFor={`${activePart}-color`}>Color</Label>
                                <ColorPickerInput
                                    value={state.colors[activePart]}
                                    onChange={handleColorChange(activePart)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`${activePart}-material`}>Material</Label>
                                <Select
                                    value={state.materials[activePart]}
                                    onValueChange={handleMaterialChange(activePart)}
                                >
                                    <SelectTrigger id={`${activePart}-material`} className="max-w-xs">
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
                    <TabsContent value="logo">
                        <div className="pt-4 space-y-4">
                            <Label htmlFor={`${activePart}-logo`}>Upload Logo (.png)</Label>
                            <Input
                                id={`${activePart}-logo`}
                                type="file"
                                accept="image/png"
                                onChange={handleLogoChange(activePart)}
                            />
                            {state.logos[activePart] && (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Current logo:</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-16 rounded-md border p-1 bg-white">
                                            <img src={state.logos[activePart]!} alt={`${cleanPartName(activePart)} logo`} className="w-full h-full object-contain" />
                                        </div>
                                        <Button variant="outline" size="icon" onClick={handleRemoveLogo(activePart)}>
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Remove Logo</span>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                 </Tabs>
              </div>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
