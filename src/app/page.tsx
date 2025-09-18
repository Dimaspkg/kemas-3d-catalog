"use client";

import { useState } from "react";
import type { MaterialKey } from "@/lib/materials";
import Header from "@/components/header";
import CosmeticCanvas from "@/components/cosmetic-canvas";
import CustomizationPanel from "@/components/customization-panel";

export type CustomizationState = {
  colors: {
    cap: string;
    body: string;
    pump: string;
  };
  materials: {
    cap: MaterialKey;
    body: MaterialKey;
    pump: MaterialKey;
  };
  background: string;
};

export default function Home() {
  const [customization, setCustomization] = useState<CustomizationState>({
    colors: {
      cap: "#C0C0C0",
      body: "#FFFFFF",
      pump: "#808080",
    },
    materials: {
      cap: "glossy",
      body: "glossy",
      pump: "metal-polished",
    },
    background: "#f5f5f5", // very light gray
  });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 p-4 md:p-8">
        <div className="lg:col-span-2 h-[50vh] lg:h-auto rounded-xl shadow-lg overflow-hidden bg-card">
          <CosmeticCanvas {...customization} />
        </div>
        <div className="lg:col-span-1">
          <CustomizationPanel
            state={customization}
            onStateChange={setCustomization}
          />
        </div>
      </main>
    </div>
  );
}
