export type MaterialProperties = {
  roughness: number;
  metalness: number;
};

export const materials: Record<string, MaterialProperties> = {
  matte: { roughness: 0.8, metalness: 0.1 },
  glossy: { roughness: 0.1, metalness: 0.1 },
  metallic: { roughness: 0.2, metalness: 0.8 },
  rubber: { roughness: 0.9, metalness: 0.0 },
  "metal-polished": { roughness: 0.05, metalness: 1.0 },
};

export type MaterialKey = keyof typeof materials;

export const materialOptions = Object.keys(materials) as MaterialKey[];
