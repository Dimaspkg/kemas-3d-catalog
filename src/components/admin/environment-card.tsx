
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Environment } from "@/lib/types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CheckCircle, Trash2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { db, storage as firebaseStorage } from '@/lib/firebase';
import { collection, doc, writeBatch, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

interface EnvironmentCardProps {
    environment: Environment;
}

function getPathFromUrl(url: string): string | null {
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

export function EnvironmentCard({ environment }: EnvironmentCardProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isActivating, setIsActivating] = useState(false);

    const handleSetActive = async () => {
        setIsActivating(true);
        const batch = writeBatch(db);
        const environmentsRef = collection(db, "environments");
        
        try {
            // Deactivate all other environments
            const q = query(environmentsRef, where("isActive", "==", true));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                batch.update(doc.ref, { isActive: false });
            });

            // Activate the selected one
            const newActiveRef = doc(db, "environments", environment.id);
            batch.update(newActiveRef, { isActive: true });

            await batch.commit();
            toast({
                title: "Success",
                description: `"${environment.name}" is now the active environment.`,
            });
        } catch (error: any) {
            console.error("Error setting active environment:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to set active environment.",
            });
        } finally {
            setIsActivating(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            // Delete from Firestore
            await deleteDoc(doc(db, "environments", environment.id));

            // Delete file from Supabase
            const filePath = getPathFromUrl(environment.fileURL);
            if (filePath) {
                const { error: fileError } = await supabase.storage.from('environment-maps').remove([filePath]);
                if (fileError) {
                    // Log warning but don't block toast
                    console.warn(`Could not delete file from storage: ${fileError.message}`);
                }
            }

            toast({
                title: "Success",
                description: `Environment "${environment.name}" deleted.`,
            });
        } catch (error: any) {
            console.error("Error deleting environment: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to delete environment.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="truncate">{environment.name}</CardTitle>
                <CardDescription>
                    Uploaded on {new Date(environment.createdAt.seconds * 1000).toLocaleDateString()}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {environment.isActive ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                    </Badge>
                ) : (
                    <Badge variant="outline">
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactive
                    </Badge>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isDeleting}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the 
                                <span className="font-bold"> {environment.name} </span> 
                                environment file.
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
                
                <Button 
                    variant="default" 
                    size="sm"
                    onClick={handleSetActive}
                    disabled={environment.isActive || isActivating}
                >
                    {isActivating ? 'Activating...' : 'Set Active'}
                </Button>
            </CardFooter>
        </Card>
    );
}
