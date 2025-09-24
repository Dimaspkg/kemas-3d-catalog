
export interface Product {
  id: string;
  name: string;
  price?: number;
  categories: string[];
  modelURL: string;
  modelURLOpen?: string; // URL for the "open" state model
  imageURL: string;
  dimensions?: string;
  godetSize?: string;
  mechanism?: string;
  material?: string;
  specialFeatures?: string;
  manufacturingLocation?: string;
  createdAt: any;
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
