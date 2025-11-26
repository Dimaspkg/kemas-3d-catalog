
'use client';

import { useState, useEffect } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle, Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddCategoryDialog } from '@/components/admin/add-category-dialog';
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ListTree } from "lucide-react";
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { EditCategoryDialog } from '@/components/admin/edit-category-dialog';
import { DeleteCategoryDialog } from '@/components/admin/delete-category-dialog';

interface Category {
  id: string;
  name: string;
}

function CategoryRowSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
    )
}

export function CategoriesDialog() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'categories'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(categoriesData);
            setLoadingCategories(false);
        });

        return () => unsubscribe();
      }, []);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <ListTree className="mr-2 h-4 w-4" />
                    View Categories
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Manage Categories</DialogTitle>
                </DialogHeader>
                <div>
                <Card className="border-0 shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Categories</CardTitle>
                            <CardDescription>
                                Group your products into categories.
                            </CardDescription>
                        </div>
                        <AddCategoryDialog />
                    </CardHeader>
                    <CardContent>
                        {loadingCategories ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <CategoryRowSkeleton />
                                    <CategoryRowSkeleton />
                                    <CategoryRowSkeleton />
                                </TableBody>
                            </Table>
                        ) : categories.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">No categories created yet.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell className="font-medium">{category.name}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <EditCategoryDialog category={category} trigger={
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                Edit
                                                            </DropdownMenuItem>
                                                        } />
                                                        <DeleteCategoryDialog categoryId={category.id} categoryName={category.name} trigger={
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
            </DialogContent>
        </Dialog>
    )
}
