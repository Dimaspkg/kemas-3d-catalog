
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
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

function MaterialRowSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
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
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Material Management</h2>
                <p className="text-muted-foreground">
                    Manage the materials available for product customization.
                </p>
            </div>
            <div className="flex items-center gap-2">
                {user && <AddMaterialDialog user={user} />}
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Your Materials</CardTitle>
                <CardDescription>
                    A list of customizable materials for your 3D models.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Metalness</TableHead>
                                <TableHead>Roughness</TableHead>
                                <TableHead>Opacity</TableHead>
                                <TableHead>Thickness</TableHead>
                                <TableHead>IOR</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <MaterialRowSkeleton />
                            <MaterialRowSkeleton />
                            <MaterialRowSkeleton />
                        </TableBody>
                    </Table>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Metalness</TableHead>
                                <TableHead>Roughness</TableHead>
                                <TableHead>Opacity</TableHead>
                                <TableHead>Thickness</TableHead>
                                <TableHead>IOR</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {materials.map((material) => (
                            <TableRow key={material.id}>
                                <TableCell className="font-medium">{material.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{material.metalness}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{material.roughness}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{material.opacity ?? 1}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{material.thickness ?? 0}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{material.ior ?? 1.5}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
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
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
