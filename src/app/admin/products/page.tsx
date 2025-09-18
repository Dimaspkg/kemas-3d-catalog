
'use client';

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

const mockProducts: Product[] = [
    { id: '1', name: 'Lipstick Model A', categories: ['Lipsticks'], modelURL: '#', imageURL: 'https://picsum.photos/seed/p1/100/100', material: 'Aluminum' },
    { id: '2', name: 'Foundation Bottle', categories: ['Foundations', 'Bottles'], modelURL: '#', imageURL: 'https://picsum.photos/seed/p2/100/100', material: 'Glass' },
    { id: '3', name: 'Mascara Wand', categories: ['Mascaras'], modelURL: '#', imageURL: 'https://picsum.photos/seed/p3/100/100', material: 'Plastic' },
];

const mockCategories: Category[] = [
    { id: '1', name: 'Lipsticks' },
    { id: '2', name: 'Foundations' },
    { id: '3', name: 'Mascaras' },
    { id: '4', name: 'Bottles' },
];

export default function ProductManagementPage() {

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
                    {mockProducts.length === 0 ? (
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
                                {mockProducts.map((product) => (
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
                     {mockCategories.length === 0 ? (
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
                                {mockCategories.map((category) => (
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
