
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface Category {
    id: string;
    name: string;
}

function ProductCardSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
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
        <aside className="w-full md:w-64 lg:w-72 space-y-6">
            <h3 className="font-semibold text-lg">Categories</h3>
            <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
                <AccordionItem value="item-0" className="border-b-0">
                    <AccordionTrigger className="text-base font-medium py-2 hover:no-underline">Product Type</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-3 p-2">
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const isMobile = useIsMobile();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const filterSidebarContent = (
      <FilterSidebar 
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
          loading={loadingCategories}
      />
  );

  return (
    <div className="flex flex-col px-4 md:px-8">
        <header className="mb-8 border-b pb-4">
            <p className="text-sm text-muted-foreground">
                KEMAS Innovations / Packaging
            </p>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-2 gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Our Packaging ({loading ? "..." : filteredProducts.length})</h1>
                <div className="flex items-center gap-2">
                    {isMounted && isMobile && (
                        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline">
                                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                                    Filters
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                                <div className="p-6 pt-12 h-full overflow-y-auto">
                                    {filterSidebarContent}
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}
                    <Button variant="ghost">
                        Sort By
                        <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </div>
        </header>

        <div className="flex flex-col md:flex-row gap-12">
            {isMounted && !isMobile && (
                 <div className="md:w-64 lg:w-72">
                    {filterSidebarContent}
                 </div>
            )}
            <main className="flex-1">
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
                        {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
                    {filteredProducts.map((product) => (
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
                                <p className="text-lg font-medium mt-1 group-hover:text-primary transition-colors">{product.name}</p>
                            </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full col-span-3">
                        <div className="text-center py-16 border-2 border-dashed rounded-lg w-full">
                             <SlidersHorizontal className="mx-auto h-8 w-8 text-muted-foreground mb-4"/>
                            <h3 className="text-lg font-semibold">No Products Found</h3>
                            <p className="text-muted-foreground mt-2">Try adjusting your filters to find what you're looking for.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    </div>
  );
}
