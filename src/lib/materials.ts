
import type * as THREE from 'three';

export const materialOptions = ["matte", "glossy", "metal-polished", "metal-rough"] as const;

export type MaterialKey = (typeof materialOptions)[number];

type MaterialProperties = {
    metalness: number;
    roughness: number;
};

export const materials: Record<MaterialKey, MaterialProperties> = {
    "matte": {
        metalness: 0,
        roughness: 0.8,
    },
    "glossy": {
        metalness: 0.2,
        roughness: 0.1,
    },
    "metal-polished": {
        metalness: 1,
        roughness: 0.2,
    },
    "metal-rough": {
        metalness: 0.8,
        roughness: 0.6,
    }
};
