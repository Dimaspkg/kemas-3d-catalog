
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
import Link from "next/link";
import { Pencil, PlusCircle } from "lucide-react";
import Image from 'next/image';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/types';
import { DeleteProductDialog } from '@/components/admin/delete-product-dialog';
import { CategoriesDialog } from '@/components/admin/categories-dialog';

function ProductRowSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-10" /></TableCell>
            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
    )
}

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
      setLoadingProducts(false);
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
            <div className="flex items-center gap-2">
                <CategoriesDialog />
                <Button asChild>
                    <Link href="/admin/products/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Product
                    </Link>
                </Button>
            </div>
        </div>
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
                            <TableHead>3D Models</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
                            <TableHead>3D Models</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
                                 <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <a href={product.modelURL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                                            View Closed
                                        </a>
                                        {product.modelURLOpen && (
                                            <a href={product.modelURLOpen} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                                                View Open
                                            </a>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex gap-2 justify-end">
                                        <Button asChild variant="ghost" size="icon">
                                            <Link href={`/admin/products/edit/${product.id}`}>
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit Product</span>
                                            </Link>
                                        </Button>
                                        <DeleteProductDialog product={product} />
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
  );
}
