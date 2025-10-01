
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { db, supabase } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import type { Material } from '@/lib/types';

interface DeleteMaterialDialogProps {
    materialId: string;
    materialName: string;
    trigger?: React.ReactNode;
}

function getPathFromUrl(url: string): string | null {
    if (!url) return null;
    try {
        const urlObject = new URL(url);
        const pathSegments = urlObject.pathname.split('/');
        const bucketNameIndex = pathSegments.findIndex(segment => segment === 'public') + 1;
        if (bucketNameIndex > 0 && bucketNameIndex + 1 < pathSegments.length) {
             return pathSegments.slice(bucketNameIndex + 1).join('/');
        }
        return null;
    } catch (error) {
        console.error("Invalid URL:", error);
        return null;
    }
}


export function DeleteMaterialDialog({ materialId, materialName, trigger }: DeleteMaterialDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const materialDocRef = doc(db, "materials", materialId);
            const materialDoc = await getDoc(materialDocRef);
            if (!materialDoc.exists()) {
                throw new Error("Material not found.");
            }
            const material = materialDoc.data() as Material;
            
            // Delete from Firestore
            await deleteDoc(materialDocRef);

            // Delete associated textures from Supabase
            const texturePaths = [
                material.baseColorMap,
                material.normalMap,
                material.roughnessMap,
                material.metalnessMap,
                material.aoMap,
            ].map(url => url ? getPathFromUrl(url) : null).filter(Boolean) as string[];

            if (texturePaths.length > 0) {
                const { error: textureError } = await supabase.storage.from('product-images').remove(texturePaths);
                if (textureError) {
                    console.warn(`Could not delete some textures from storage: ${textureError.message}`);
                }
            }

            toast({
                title: "Success",
                description: `Material "${materialName}" deleted.`,
            });
        } catch (error: any) {
            console.error("Error deleting material: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to delete material.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {trigger || (
                    <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Material</span>
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the 
                        <span className="font-bold"> {materialName} </span> 
                        material and all its associated texture files.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
