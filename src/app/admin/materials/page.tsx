
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Gem } from "lucide-react";
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { Material } from '@/lib/types';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddMaterialDialog } from '@/components/admin/materials/add-material-dialog';
import { EditMaterialDialog } from '@/components/admin/materials/edit-material-dialog';
import { DeleteMaterialDialog } from '@/components/admin/materials/delete-material-dialog';
import { Badge } from '@/components/ui/badge';
import { MaterialCategoriesDialog } from '@/components/admin/materials/categories/material-categories-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';


function MaterialCardSkeleton() {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="space-y-2 pt-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </CardContent>
             <CardFooter className="justify-between">
                 <Skeleton className="h-6 w-24" />
                 <Skeleton className="h-8 w-8 rounded-full" />
            </CardFooter>
        </Card>
    )
}

function InfoBadge({ label, value }: { label: string, value: string | number | undefined }) {
  if (value === undefined) return null;
  return (
    <Badge variant="outline" className="text-xs">
        <span className="text-muted-foreground mr-1.5">{label}</span>
        {value}
    </Badge>
  )
}

export default function MaterialManagementPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
    });

    const q = query(collection(db, 'materials'), orderBy('createdAt', 'desc'));
    const unsubscribeMaterials = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material));
      setMaterials(data);
      setLoading(false);
    });

    return () => {
        unsubscribeAuth();
        unsubscribeMaterials();
    };
  }, []);

  return (
    <div className="space-y-6">
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Material Management</h2>
                    <p className="text-muted-foreground">
                        Manage the materials available for product customization.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <MaterialCategoriesDialog />
                    {user && <AddMaterialDialog user={user} />}
                </div>
            </div>
            <Separator />
        </div>

        {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <MaterialCardSkeleton key={i} />)}
            </div>
        ) : materials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {materials.map((material, index) => (
                    <Card key={material.id} className="relative flex flex-col hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3 pr-8">
                                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted border shrink-0">
                                        <span className="text-muted-foreground font-mono text-xs">{index + 1}</span>
                                    </div>
                                    <CardTitle className="text-lg leading-tight">{material.name}</CardTitle>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 absolute top-2 right-2">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <EditMaterialDialog material={material} trigger={
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                Edit
                                            </DropdownMenuItem>
                                        } />
                                        <DeleteMaterialDialog materialId={material.id} materialName={material.name} trigger={
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                Delete
                                            </DropdownMenuItem>
                                        } />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                             <div className="flex flex-wrap gap-1 pt-2">
                                {material.categories?.map(cat => <Badge key={cat} variant="secondary">{cat}</Badge>)}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 flex-1">
                            <div className="flex flex-wrap gap-1.5">
                                <InfoBadge label="M" value={material.metalness} />
                                <InfoBadge label="R" value={material.roughness} />
                                {(material.opacity !== undefined && material.opacity < 1) && <InfoBadge label="O" value={material.opacity} />}
                            </div>
                        </CardContent>
                        <CardFooter>
                           
                        </CardFooter>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-lg col-span-full">
                <Gem className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Materials Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">Get started by adding your first material.</p>
                <div className="mt-6">
                    {user && <AddMaterialDialog user={user} />}
                </div>
            </div>
        )}
    </div>
  );
}
