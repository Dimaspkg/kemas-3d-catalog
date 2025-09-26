
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { db, auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from 'firebase/auth';
import { Textarea } from '@/components/ui/textarea';

interface Category {
  id: string;
  name: string;
}

const productFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    categories: z.array(z.string()).refine((value) => value.length > 0, {
        message: "You must select at least one category.",
    }),
    productImages: z.any().refine(
        (files) => files?.length > 0,
        "At least one product image is required."
    ),
    modelFile: z.any().refine(
        (files) => files?.length > 0,
        "A model file for the closed state is required."
    ),
    modelFileOpen: z.any().optional(), // Optional open state model
    dimensions: z.string().optional(),
    godetSize: z.string().optional(),
    mechanism: z.string().optional(),
    material: z.string().optional(),
    specialFeatures: z.string().optional(),
    manufacturingLocation: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function NewProductPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: "",
            description: "",
            categories: [],
            productImages: undefined,
            modelFile: undefined,
            modelFileOpen: undefined,
            dimensions: "",
            godetSize: "",
            mechanism: "",
            material: "",
            specialFeatures: "",
            manufacturingLocation: "",
        },
    });
    
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setUser(user);
            } else {
                router.push('/login');
            }
        });
        
        const q = query(collection(db, 'categories'), orderBy('name'));
        const unsubscribeCategories = onSnapshot(q, (snapshot) => {
            const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(categoriesData);
            setLoadingCategories(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeCategories();
        };
    }, [router]);

    const uploadFile = async (file: File, bucket: string, userId: string): Promise<string> => {
        const safeFileName = file.name.replace(/\s+/g, '-');
        const fileName = `${userId}/${uuidv4()}-${safeFileName}`;
        const { error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            });
        if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`);
        
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return publicUrl;
    }

    const onSubmit = async (data: ProductFormValues) => {
        if (!user) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to add a product." });
            return;
        }

        setIsSubmitting(true);
        const productImageFiles = data.productImages;
        const modelFile = data.modelFile?.[0];
        const modelFileOpen = data.modelFileOpen?.[0];

        if (!productImageFiles || productImageFiles.length === 0 || !modelFile) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Product images and closed state model file are required.",
            });
            setIsSubmitting(false);
            return;
        }

        try {
            const uploadPromises: Promise<string>[] = [];
            for (const file of productImageFiles) {
                uploadPromises.push(uploadFile(file, 'product-images', user.uid));
            }
            const imageURLs = await Promise.all(uploadPromises);

            const modelURL = await uploadFile(modelFile, 'product-models', user.uid);
            
            const productData: any = {
                name: data.name,
                description: data.description,
                categories: data.categories,
                imageURLs,
                modelURL,
                dimensions: data.dimensions,
                godetSize: data.godetSize,
                mechanism: data.mechanism,
                material: data.material,
                specialFeatures: data.specialFeatures,
                manufacturingLocation: data.manufacturingLocation,
                createdAt: new Date(),
                userId: user.uid,
            };
            
            if (modelFileOpen) {
                productData.modelURLOpen = await uploadFile(modelFileOpen, 'product-models', user.uid);
            }

            // Save product data to Firestore
            await addDoc(collection(db, "products"), productData);
            
            toast({
                title: "Success",
                description: "Product added successfully.",
            });
            router.push('/admin/products');

        } catch (error: any) {
            console.error("Error adding document: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to add product.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Form {...form}>
            <form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
                        <p className="text-muted-foreground">
                            Fill in the details for your new 3D product model.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" asChild>
                            <Link href="/admin/products">Cancel</Link>
                        </Button>
                        <Button type="submit" form="product-form" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Product'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Details</CardTitle>
                                <CardDescription>Basic information and assets for the product.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Lipstick Tube" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Tell us a little bit about this product"
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="categories"
                                    render={() => (
                                        <FormItem>
                                        <div className="mb-4">
                                            <FormLabel className="text-base">Categories</FormLabel>
                                            <FormDescription>
                                                Select one or more categories for your product.
                                            </FormDescription>
                                        </div>
                                        {loadingCategories ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-3"><Skeleton className="h-4 w-4" /><Skeleton className="h-4 w-20" /></div>
                                                <div className="flex items-center space-x-3"><Skeleton className="h-4 w-4" /><Skeleton className="h-4 w-24" /></div>
                                                <div className="flex items-center space-x-3"><Skeleton className="h-4 w-4" /><Skeleton className="h-4 w-16" /></div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {categories.map((item) => (
                                                    <FormField
                                                    key={item.id}
                                                    control={form.control}
                                                    name="categories"
                                                    render={({ field }) => {
                                                        return (
                                                        <FormItem
                                                            key={item.id}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(item.name)}
                                                                onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), item.name])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                        (value) => value !== item.name
                                                                        )
                                                                    )
                                                                }}
                                                            />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                {item.name}
                                                            </FormLabel>
                                                        </FormItem>
                                                        )
                                                    }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="productImages"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Images</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="file" 
                                                    accept="image/png, image/jpeg, image/webp"
                                                    multiple
                                                    onChange={(e) => field.onChange(e.target.files)}
                                                />
                                            </FormControl>
                                            <FormDescription>You can upload multiple images.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="modelFile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>3D Model File (Closed State)</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="file" 
                                                    accept=".glb,.gltf"
                                                    onChange={(e) => field.onChange(e.target.files)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="modelFileOpen"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>3D Model File (Open State - Optional)</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="file" 
                                                    accept=".glb,.gltf"
                                                    onChange={(e) => field.onChange(e.target.files)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Specifications</CardTitle>
                                <CardDescription>Provide detailed specifications for the product.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="dimensions"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dimensions</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 10cm x 3cm x 3cm" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="godetSize"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Godet/Cup Size</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 12.1mm" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="mechanism"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mechanism</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Twist-up" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="material"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Material</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Aluminum, Plastic" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="specialFeatures"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Special Features</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Magnetic closure" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="manufacturingLocation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Manufacturing Location</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Italy" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </Form>
    );
}
