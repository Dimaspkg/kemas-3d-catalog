
export interface Product {
  id: string;
  name: string;
  description?: string;
  categories: string[];
  modelURL: string;
  modelURLOpen?: string; // URL for the "open" state model
  imageURLs: string[];
  dimensions?: string;
  godetSize?: string;
  mechanism?: string;
  material?: string;
  specialFeatures?: string;
  manufacturingLocation?: string;
  createdAt: any;
  hotspots?: Hotspot[];
}

export interface Environment {
  id: string;
  name: string;
  fileURL: string;
  isActive: boolean;
  createdAt: any;
  userId: string;
}

export interface CanvasHandle {
  takeScreenshot: () => void;
}

export interface Settings {
  logoURL?: string;
}

export interface Hotspot {
  id: string;
  name: string;
  title: string;
  description: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

export interface Material {
  id: string;
  name: string;
  categories?: string[];
  metalness: number;
  roughness: number;
  opacity?: number;
  thickness?: number;
  ior?: number;
  createdAt: any;
  baseColorMap?: string;
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
  aoMap?: string;
}
