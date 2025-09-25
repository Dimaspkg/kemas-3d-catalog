
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
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
import type { Product } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface DeleteProductDialogProps {
    product: Product;
}

// Extracts the file path from a Supabase storage URL
function getPathFromUrl(url: string): string | null {
    try {
        const urlObject = new URL(url);
        // The path is typically /storage/v1/object/public/bucket-name/file-path
        const pathSegments = urlObject.pathname.split('/');
        // The file path is everything after the bucket name
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


export function DeleteProductDialog({ product }: DeleteProductDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            // Delete from Firestore
            await deleteDoc(doc(db, "products", product.id));

            // Collect all file paths to delete
            const imagePathsToDelete = product.imageURLs.map(getPathFromUrl).filter(Boolean) as string[];
            const modelPathsToDelete: string[] = [];

            const modelPath = getPathFromUrl(product.modelURL);
            if (modelPath) modelPathsToDelete.push(modelPath);

            if (product.modelURLOpen) {
                const modelOpenPath = getPathFromUrl(product.modelURLOpen);
                if (modelOpenPath) modelPathsToDelete.push(modelOpenPath);
            }

            // Delete files from Supabase
            if (imagePathsToDelete.length > 0) {
                 const { error: imageError } = await supabase.storage.from('product-images').remove(imagePathsToDelete);
                 if (imageError) console.warn(`Could not delete some images from storage: ${imageError.message}`);
            }
            if (modelPathsToDelete.length > 0) {
                 const { error: modelError } = await supabase.storage.from('product-models').remove(modelPathsToDelete);
                 if (modelError) console.warn(`Could not delete some models from storage: ${modelError.message}`);
            }

            toast({
                title: "Success",
                description: `Product "${product.name}" deleted.`,
            });
        } catch (error: any) {
            console.error("Error deleting product: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to delete product.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Product</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the 
                        <span className="font-bold"> {product.name} </span> 
                        product and its associated files.
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
