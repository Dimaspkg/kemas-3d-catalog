
import type * as THREE from 'three';

// This file is now deprecated and will be removed in a future step.
// Material data is now fetched from Firestore.

export const materialOptions = [
    { key: "matte", name: "Matte" },
    { key: "glossy", name: "Glossy" },
    { key: "metal-polished", name: "Polished Metal" },
    { key: "metal-rough", name: "Rough Metal" },
    { key: "mirror", name: "Mirror" },
] as const;


export type MaterialKey = (typeof materialOptions)[number]['key'];

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
    },
    "mirror": {
        metalness: 1,
        roughness: 0,
    }
};
