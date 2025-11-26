
'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Lightbulb, Pipette, Award } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ProductCardSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    )
}

export default function LandingPage() {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(3));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          setFeaturedProducts(productsData);
          setLoading(false);
        });
    
        return () => unsubscribe();
      }, []);

    return (
        <div className="flex flex-col flex-1">
            {/* Featured Products Section */}
            <section className="py-20 px-4 bg-background">
                <div className="container mx-auto">
                    {loading ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            <ProductCardSkeleton />
                            <ProductCardSkeleton />
                            <ProductCardSkeleton />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featuredProducts.map((product) => (
                                <div key={product.id} className="group">
                                    <Link href={`/products/${product.id}`} className="block">
                                       <Card className="overflow-hidden rounded-lg">
                                           <CardContent className="p-0">
                                               <div className="relative aspect-square w-full bg-muted">
                                                   {product.imageURLs && product.imageURLs.length > 0 ? (
                                                       <Image 
                                                           src={product.imageURLs[0]}
                                                           alt={product.name}
                                                           fill
                                                           className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                       />
                                                   ) : (
                                                       <div className="w-full h-full bg-secondary"></div>
                                                   )}
                                               </div>
                                           </CardContent>
                                       </Card>
                                   </Link>
                                   <div className="mt-4">
                                       <p className="text-sm text-muted-foreground">{product.categories?.join(', ')}</p>
                                       <Link href={`/products/${product.id}`} className="block">
                                          <p className="text-lg font-medium mt-1 hover-underline-animation">{product.name}</p>
                                       </Link>
                                   </div>
                               </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

const style = typeof document !== 'undefined' ? document.createElement('style') : null;
if (style) {
  style.textContent = `
    .bg-grid-slate-900\\[0\\.04\\] {
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(15 23 42 / 0.1)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
    }
  `;
  if (typeof document !== 'undefined') {
    document.head.append(style);
  }
}
