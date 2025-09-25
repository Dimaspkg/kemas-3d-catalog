
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';

function ProductCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-40 w-full rounded-md" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-6 w-3/4 mt-2" />
                <Skeleton className="h-4 w-1/2 mt-2" />
            </CardContent>
        </Card>
    )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Our Products</h1>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link href={`/products/${product.id}`} key={product.id} className="group">
              <Card>
                  <CardHeader className="p-0">
                      <div className="relative aspect-square w-full">
                          {product.imageURLs && product.imageURLs.length > 0 && (
                            <Image 
                                src={product.imageURLs[0]}
                                alt={product.name}
                                fill
                                className="object-cover rounded-t-lg transition-transform group-hover:scale-105"
                            />
                          )}
                      </div>
                  </CardHeader>
                <CardContent className="pt-4">
                  <CardTitle className="text-lg group-hover:text-primary">{product.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{product.categories?.join(', ')}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No products found.</p>
        </div>
      )}
    </div>
  );
}
