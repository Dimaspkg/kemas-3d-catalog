
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brush } from 'lucide-react';

function SpecificationRow({ label, value }: { label: string, value?: string }) {
    if (!value) return null;
    return (
        <TableRow>
            <TableCell className="font-medium text-muted-foreground">{label}</TableCell>
            <TableCell>{value}</TableCell>
        </TableRow>
    )
}

export default function ProductDetailPage() {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const params = useParams();
    const productId = params.id as string;

    useEffect(() => {
        if (!productId) return;
        
        const fetchProduct = async () => {
            setLoading(true);
            const docRef = doc(db, 'products', productId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
            } else {
                // Handle product not found, maybe redirect or show a message
                console.log("No such document!");
            }
            setLoading(false);
        };

        fetchProduct();
    }, [productId]);

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <Skeleton className="h-8 w-40 mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="w-full aspect-square rounded-lg" />
                    <div className="space-y-6">
                        <Skeleton className="h-10 w-3/4" />
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-8 w-1/3" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container mx-auto py-8 text-center">
                 <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
                 <p className="text-muted-foreground">The product you are looking for does not exist.</p>
                 <Button asChild variant="link" className="mt-4">
                    <Link href="/products">
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Back to Products
                    </Link>
                 </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <Button asChild variant="ghost" className="mb-6">
                <Link href="/products">
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Back to All Products
                </Link>
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
                <div className="md:col-span-3">
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden border">
                         <Image
                            src={product.imageURL}
                            alt={product.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
                <div className="md:col-span-2 self-start sticky top-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {product.categories?.map(category => (
                            <Badge key={category} variant="secondary">{category}</Badge>
                        ))}
                    </div>
                    
                    <Button asChild size="lg" className="w-full mb-6">
                        <Link href={`/canvas?productId=${product.id}`}>
                            <Brush className="mr-2 h-5 w-5" />
                            Customize This Product
                        </Link>
                    </Button>

                    <Card>
                        <CardHeader>
                            <CardTitle>Specifications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableBody>
                                    <SpecificationRow label="Dimensions" value={product.dimensions} />
                                    <SpecificationRow label="Godet / Cup Size" value={product.godetSize} />
                                    <SpecificationRow label="Mechanism" value={product.mechanism} />
                                    <SpecificationRow label="Material" value={product.material} />
                                    <SpecificationRow label="Special Features" value={product.specialFeatures} />
                                    <SpecificationRow label="Manufacturing Location" value={product.manufacturingLocation} />
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
