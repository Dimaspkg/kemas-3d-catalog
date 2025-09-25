
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cleanPartName(name: string): string {
    if (!name) return "";
    // Replaces underscores with spaces.
    const cleanedName = name.replace(/_/g, ' ');
    return cleanedName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
