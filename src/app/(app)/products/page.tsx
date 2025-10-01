
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { CustomiseIcon } from '@/components/icons/customise-icon';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Category {
    id: string;
    name: string;
}

function ProductCardSkeleton() {
    return (
        <div>
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-2/3 mt-4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
            <Skeleton className="h-4 w-1/4 mt-2" />
        </div>
    )
}

function FilterSidebar({ 
    categories, 
    selectedCategories, 
    onCategoryChange,
    loading 
}: { 
    categories: Category[], 
    selectedCategories: string[], 
    onCategoryChange: (categoryId: string, checked: boolean) => void,
    loading: boolean
}) {
    return (
        <aside className="w-full md:w-64 lg:w-72 space-y-6 bg-muted p-6 rounded-lg">
            <p className="font-semibold text-lg">Categories</p>
            <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
                <AccordionItem value="item-0" className="border-b-0">
                    <AccordionTrigger className="text-base font-medium py-2 hover:no-underline">Product Type</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 p-2">
                           {loading ? (
                                <>
                                    <div className="flex items-center space-x-2"><Skeleton className="h-4 w-4" /><Skeleton className="h-4 w-24" /></div>
                                    <div className="flex items-center space-x-2"><Skeleton className="h-4 w-4" /><Skeleton className="h-4 w-20" /></div>
                                </>
                           ) : (
                               categories.map(category => (
                                   <div key={category.id} className="flex items-center space-x-2">
                                       <Checkbox
                                           id={`cat-${category.id}`}
                                           checked={selectedCategories.includes(category.name)}
                                           onCheckedChange={(checked) => onCategoryChange(category.name, !!checked)}
                                       />
                                       <Label htmlFor={`cat-${category.id}`} className="font-normal cursor-pointer">
                                           {category.name}
                                       </Label>
                                   </div>
                               ))
                           )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </aside>
    )
}

const formatPrice = (price?: number) => {
    if (!price) return "N/A";
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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

  const handleCategoryChange = (categoryName: string, checked: boolean) => {
    setSelectedCategories(prev => 
        checked 
            ? [...prev, categoryName] 
            : prev.filter(name => name !== categoryName)
    );
  };

  const filteredProducts = useMemo(() => {
    if (selectedCategories.length === 0) {
        return products;
    }
    return products.filter(product =>
        selectedCategories.every(category => product.categories?.includes(category))
    );
  }, [products, selectedCategories]);

  const loading = loadingProducts || loadingCategories;

  return (
    <div className="flex flex-col px-4">
        <header className="mb-8">
            <div className="text-sm text-muted-foreground">
                <p>KEMAS Innovations / Products</p>
            </div>
            <div className="flex justify-between items-center mt-2">
                <h1 className="text-3xl font-bold">Our Products ({loading ? "..." : filteredProducts.length})</h1>
                <div className="flex items-center gap-4">
                    <Button variant="ghost">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Hide Filters
                    </Button>
                    <Button variant="ghost">
                        Sort By
                        <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </div>
        </header>

        <div className="flex flex-col md:flex-row gap-12">
            <FilterSidebar 
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
                loading={loadingCategories}
            />
            <main className="flex-1">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                        {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="group">
                             <Link href={`/products/${product.id}`} className="block">
                                <Card className="border-none shadow-none rounded-none bg-transparent">
                                    <CardContent className="p-0">
                                        <div className="relative aspect-square w-full bg-muted rounded-lg">
                                            {product.imageURLs && product.imageURLs.length > 0 && (
                                                <Image 
                                                    src={product.imageURLs[0]}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover rounded-lg transition-transform group-hover:scale-105"
                                                />
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <div className="mt-4">
                                <p className="text-orange-600 font-semibold text-sm">Customise</p>
                                <p className="text-base font-medium mt-1 group-hover:text-primary">{product.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">{product.categories?.join(', ')}</p>
                                <p className="text-base font-semibold mt-2">{formatPrice(product.price)}</p>
                            </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full col-span-3">
                        <div className="text-center py-12 border-2 border-dashed rounded-lg w-full">
                            <p className="text-muted-foreground">No products found matching your filter.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    </div>
  );
}
