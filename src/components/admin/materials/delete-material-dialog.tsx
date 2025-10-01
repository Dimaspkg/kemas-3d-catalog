
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

interface DeleteMaterialDialogProps {
    materialId: string;
    materialName: string;
    trigger?: React.ReactNode;
}

export function DeleteMaterialDialog({ materialId, materialName, trigger }: DeleteMaterialDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, "materials", materialId));
            toast({
                title: "Success",
                description: `Material "${materialName}" deleted.`,
            });
        } catch (error) {
            console.error("Error deleting material: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete material.",
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
                        material.
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
