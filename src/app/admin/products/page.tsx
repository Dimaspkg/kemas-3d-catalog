
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
import { AddCategoryDialog } from '@/components/admin/add-category-dialog';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import Image from 'next/image';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { EditCategoryDialog } from '@/components/admin/edit-category-dialog';
import { DeleteCategoryDialog } from '@/components/admin/delete-category-dialog';


interface Product {
  id: string;
  name: string;
  categories: string[];
  modelURL: string;
  imageURL: string;
  material?: string;
}

interface Category {
  id: string;
  name: string;
}

function ProductRowSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-10" /></TableCell>
        </TableRow>
    )
}

function CategoryRowSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
    )
}


export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
      setLoadingProducts(false);
    });

    return () => unsubscribe();
  }, []);

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
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Product Management</h2>
                <p className="text-muted-foreground">
                    Manage your 3D products and categories here.
                </p>
            </div>
            <Button asChild>
                <Link href="/admin/products/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Product
                </Link>
            </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Your Products</CardTitle>
                    <CardDescription>
                    A list of your uploaded 3D models.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingProducts ? (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Categories</TableHead>
                                <TableHead>Material</TableHead>
                                <TableHead>File</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <ProductRowSkeleton />
                                <ProductRowSkeleton />
                                <ProductRowSkeleton />
                            </TableBody>
                        </Table>
                    ) : products.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No products uploaded yet.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Categories</TableHead>
                                <TableHead>Material</TableHead>
                                <TableHead>File</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <Image 
                                            src={product.imageURL} 
                                            alt={product.name}
                                            width={64}
                                            height={64}
                                            className="rounded-md object-cover"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.categories?.join(', ')}</TableCell>
                                    <TableCell>{product.material || 'N/A'}</TableCell>
                                     <TableCell>
                                        <a href={product.modelURL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            View
                                        </a>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Categories</CardTitle>
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
                                    <TableHead>Actions</TableHead>
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
                                            <div className="flex gap-2 justify-end">
                                                <EditCategoryDialog category={category} />
                                                <DeleteCategoryDialog categoryId={category.id} categoryName={category.name} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
