
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddProductDialog } from '@/components/admin/add-product-dialog';
import { AddCategoryDialog } from '@/components/admin/add-category-dialog';


interface Product {
  id: string;
  name: string;
  categories: string[];
  modelURL: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const unsubscribeProducts = onSnapshot(collection(db, 'models'), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
        const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(categoriesData);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
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
            <AddProductDialog categories={categories} />
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
                    {products.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No products uploaded yet.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Categories</TableHead>
                                <TableHead>File</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.categories?.join(', ')}</TableCell>
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
                        </Description>
                    </div>
                    <AddCategoryDialog />
                </CardHeader>
                <CardContent>
                     {categories.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No categories created yet.</p>
                        </div>
                     ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.name}</TableCell>
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
