
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { db } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { collection, doc, getDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/types';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface Category {
  id: string;
  name: string;
}

const productFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be a positive number.").optional(),
    categories: z.array(z.string()).refine((value) => value.length > 0, {
        message: "You must select at least one category.",
    }),
    productImages: z.any().optional(),
    modelFile: z.any().optional(),
    modelFileOpen: z.any().optional(),
    dimensions: z.string().optional(),
    godetSize: z.string().optional(),
    mechanism: z.string().optional(),
    material: z.string().optional(),
    specialFeatures: z.string().optional(),
    manufacturingLocation: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// Extracts the file path from a Supabase storage URL
function getPathFromUrl(url: string): string | null {
    if (!url) return null;
    try {
        const urlObject = new URL(url);
        // The path is typically /storage/v1/object/public/bucket-name/file-path
        const pathSegments = urlObject.pathname.split('/');
        const bucketNameIndex = pathSegments.findIndex(segment => segment === 'public') + 1;
        if (bucketNameIndex > 0 && bucketNameIndex + 1 < pathSegments.length) {
             return pathSegments.slice(bucketNameIndex + 1).join('/');
        }
        return null;
    } catch (error) {
        console.error("Invalid URL:", error);
        return null;
    }
}


export default function EditProductPage() {
    const [product, setProduct] = useState<Product | null>(null);
    const [loadingProduct, setLoadingProduct] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [currentImageURLs, setCurrentImageURLs] = useState<string[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: "",
            description: "",
            price: 0,
            categories: [],
            dimensions: "",
            godetSize: "",
            mechanism: "",
            material: "",
            specialFeatures: "",
            manufacturingLocation: "",
        },
    });

    useEffect(() => {
        if (!productId) return;
        const fetchProduct = async () => {
            const docRef = doc(db, 'products', productId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const productData = { id: docSnap.id, ...docSnap.data() } as Product;
                setProduct(productData);
                setCurrentImageURLs(productData.imageURLs || []);
                form.reset({
                    ...productData,
                    price: productData.price || 0,
                    description: productData.description || "",
                });
            } else {
                 toast({ variant: "destructive", title: "Error", description: "Product not found." });
                 router.push('/admin/products');
            }
            setLoadingProduct(false);
        };
        fetchProduct();
    }, [productId, router, toast, form]);


    useEffect(() => {
        const q = query(collection(db, 'categories'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(categoriesData);
            setLoadingCategories(false);
        });

        return () => unsubscribe();
    }, []);

    const handleRemoveImage = (urlToRemove: string) => {
        setCurrentImageURLs(currentImageURLs.filter(url => url !== urlToRemove));
        setImagesToDelete(prev => [...prev, urlToRemove]);
    };

    const uploadFile = async (file: File, bucket: string): Promise<string> => {
        const safeFileName = file.name.replace(/\s+/g, '-');
        const fileName = `${uuidv4()}-${safeFileName}`;
        const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });
        if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`);
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return publicUrl;
    };

    const onSubmit = async (data: ProductFormValues) => {
        if (!product) return;
        setIsSubmitting(true);
        
        let finalImageURLs = [...currentImageURLs];
        let modelURL = product.modelURL;
        let modelURLOpen = product.modelURLOpen;

        try {
             // Delete images marked for deletion from Supabase
             if (imagesToDelete.length > 0) {
                const pathsToDelete = imagesToDelete.map(getPathFromUrl).filter(Boolean) as string[];
                if(pathsToDelete.length > 0) {
                    await supabase.storage.from('product-images').remove(pathsToDelete);
                }
            }

            const productImageFiles = data.productImages;
            const modelFile = data.modelFile?.[0];
            const modelFileOpen = data.modelFileOpen?.[0];

            if (productImageFiles && productImageFiles.length > 0) {
                const uploadPromises: Promise<string>[] = [];
                for (const file of productImageFiles) {
                    uploadPromises.push(uploadFile(file, 'product-images'));
                }
                const newImageURLs = await Promise.all(uploadPromises);
                finalImageURLs = [...finalImageURLs, ...newImageURLs];
            }


            if (modelFile) {
                modelURL = await uploadFile(modelFile, 'product-models');
            }

            if (modelFileOpen) {
                modelURLOpen = await uploadFile(modelFileOpen, 'product-models');
            }

            // Update product data in Firestore
            const productRef = doc(db, "products", product.id);
            await updateDoc(productRef, {
                name: data.name,
                description: data.description,
                price: data.price,
                categories: data.categories,
                imageURLs: finalImageURLs,
                modelURL,
                modelURLOpen,
                dimensions: data.dimensions,
                godetSize: data.godetSize,
                mechanism: data.mechanism,
                material: data.material,
                specialFeatures: data.specialFeatures,
                manufacturingLocation: data.manufacturingLocation,
            });
            
            toast({
                title: "Success",
                description: "Product updated successfully.",
            });
            router.push('/admin/products');

        } catch (error: any) {
            console.error("Error updating document: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to update product.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loadingProduct) {
        return (
             <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
                        <p className="text-muted-foreground">
                            Update the details for your 3D product model.
                        </p>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                     <div className="md:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Specifications</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                 </div>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
                        <p className="text-muted-foreground">
                           Update the details for <span className="font-semibold">{product?.name}</span>.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" asChild>
                            <Link href="/admin/products">Cancel</Link>
                        </Button>
                        <Button type="submit" form="product-form" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
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
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price (IDR)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="e.g. 150000" {...field} />
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
                                <div>
                                    <FormLabel>Current Images</FormLabel>
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        {currentImageURLs.map(url => (
                                            <div key={url} className="relative group">
                                                <Image src={url} alt="Product image" width={80} height={80} className="rounded-md object-cover" />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleRemoveImage(url)}
                                                >
                                                    <X className="h-4 w-4" />
                                                    <span className="sr-only">Remove image</span>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="productImages"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Add More Product Images</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="file" 
                                                    accept="image/png, image/jpeg, image/webp"
                                                    multiple
                                                    onChange={(e) => field.onChange(e.target.files)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="modelFile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Replace 3D Model (Closed) (Optional)</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="file" 
                                                    accept=".glb,.gltf"
                                                    onChange={(e) => field.onChange(e.target.files)}
                                                />
                                            </FormControl>
                                            <FormDescription>Current closed model is set.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="modelFileOpen"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Replace 3D Model (Open) (Optional)</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="file" 
                                                    accept=".glb,.gltf"
                                                    onChange={(e) => field.onChange(e.target.files)}
                                                />
                                            </FormControl>
                                            {product?.modelURLOpen ? (
                                                <FormDescription>Current open model is set.</FormDescription>
                                            ) : (
                                                <FormDescription>No open state model uploaded.</FormDescription>
                                            )}
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

    


