
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
import { CustomiseIcon } from '@/components/icons/customise-icon';

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
            <div className="w-full">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="flex overflow-x-auto md:flex-col">
                        <Skeleton className="w-full aspect-square bg-muted rounded-lg shrink-0" />
                        <Skeleton className="w-full aspect-square bg-muted rounded-lg shrink-0" />
                    </div>
                    <div className="space-y-6 px-4 md:px-8">
                        <Skeleton className="h-10 w-3/4" />
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-12 w-full" />
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
            <div className="text-center px-4 py-20">
                 <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
                 <p className="text-muted-foreground">The product you are looking for does not exist.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="flex overflow-x-auto snap-x snap-mandatory md:flex-col md:overflow-y-auto">
                    {product.imageURLs.map((url, index) => (
                        <div key={index} className="relative aspect-square w-full shrink-0 snap-start">
                            <Image
                                src={url}
                                alt={`${product.name} image ${index + 1}`}
                                fill
                                className="object-cover"
                                priority={index === 0}
                            />
                        </div>
                    ))}
                </div>
                <div className="md:sticky md:top-0 md:h-screen md:overflow-y-auto px-4 md:px-8 py-8 md:py-12">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {product.categories?.map(category => (
                            <Badge key={category} variant="secondary">{category}</Badge>
                        ))}
                    </div>
                    
                    <Button asChild size="lg" variant="outline" className="w-full mb-6 rounded-full py-8 text-lg hover:shadow-md transition-shadow">
                        <Link href={`/canvas?productId=${product.id}`}>
                            <span className="mr-2">Customise</span>
                            <CustomiseIcon className="h-5 w-5" />
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
