
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

function FeatureCard({ icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
    const Icon = icon;
    return (
        <div className="text-center p-6 border border-border/20 rounded-lg bg-background/50 backdrop-blur-sm">
            <div className="flex justify-center mb-4">
                <div className="p-3 bg-secondary rounded-full">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
            </div>
            <h3 className="text-xl font-headline mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    );
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
            {/* Hero Section */}
            <section className="relative text-center py-20 md:py-32 px-4 bg-secondary/30">
                 <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[10px_10px] [mask-image:linear-gradient(0deg,transparent,black)]"></div>
                <div className="container mx-auto relative">
                    <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight mb-4">
                        Wujudkan Kemasan Impian Anda
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
                        Jelajahi, kustomisasi, dan visualisasikan kemasan kosmetik Anda secara real-time dengan teknologi 3D interaktif kami.
                    </p>
                    <Button asChild size="lg" className="rounded-full py-7 px-8 text-base">
                        <Link href="/products">
                            Mulai Kustomisasi
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={Lightbulb}
                            title="Inovasi Desain"
                            description="Teknologi terdepan untuk menciptakan kemasan yang unik dan fungsional."
                        />
                        <FeatureCard 
                            icon={Pipette}
                            title="Kustomisasi Tanpa Batas"
                            description="Pilih material, warna, dan finishing untuk menciptakan identitas brand Anda."
                        />
                        <FeatureCard 
                            icon={Award}
                            title="Kualitas Terjamin"
                            description="Diproduksi dengan standar tertinggi untuk hasil akhir yang premium dan presisi."
                        />
                    </div>
                </div>
            </section>

            {/* Featured Products Section */}
            <section className="py-20 px-4 bg-background">
                <div className="container mx-auto">
                    <div className="text-center mb-12">
                         <h2 className="text-3xl md:text-4xl font-headline font-bold">Produk Unggulan</h2>
                         <p className="text-muted-foreground mt-2">Lihat beberapa desain populer kami.</p>
                    </div>
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
                                       <Card className="overflow-hidden rounded-lg border-none shadow-none">
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

             {/* Final CTA Section */}
             <section className="py-20 px-4 bg-secondary/30">
                <div className="container mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">
                        Siap Menciptakan Sesuatu yang Luar Biasa?
                    </h2>
                    <p className="max-w-xl mx-auto text-muted-foreground mb-8">
                        Jelajahi katalog lengkap kami dan temukan kemasan yang sempurna untuk produk Anda.
                    </p>
                    <Button asChild size="lg" variant="default" className="rounded-full py-7 px-8 text-base">
                        <Link href="/products">
                            Lihat Semua Produk
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}

const style = typeof document !== 'undefined' ? document.createElement('style') : null;
if (style) {
  style.textContent = `
    .bg-grid-slate-900\\/\\[0\\.04\\] {
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(15 23 42 / 0.1)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
    }
  `;
  if (typeof document !== 'undefined') {
    document.head.append(style);
  }
}
