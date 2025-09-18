
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { db } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { collection, addDoc } from 'firebase/firestore';
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

const mockCategories: Category[] = [
    { id: '1', name: 'Lipsticks' },
    { id: '2', name: 'Foundations' },
    { id: '3', name: 'Mascaras' },
    { id: '4', name: 'Bottles' },
];


const productFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    categories: z.array(z.string()).refine((value) => value.length > 0, {
        message: "You must select at least one category.",
    }),
    modelFile: (typeof window === 'undefined' ? z.any() : z.instanceof(FileList)).refine(
        (files) => files?.length > 0,
        "A model file is required."
    ),
    productImage: (typeof window === 'undefined' ? z.any() : z.instanceof(FileList)).refine(
        (files) => files?.length > 0,
        "A product image is required."
    ),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function NewProductPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: "",
            categories: [],
        },
    });

    const onSubmit = async (data: ProductFormValues) => {
        setIsSubmitting(true);
        const modelFile = data.modelFile[0];
        const productImageFile = data.productImage[0];

        if (!modelFile || !productImageFile) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Model file and product image are required.",
            });
            setIsSubmitting(false);
            return;
        }

        try {
            // NOTE: This uses mock data and will not persist.
            // In a real app, you would upload to Supabase and save to Firestore.
            console.log("Submitting with mock data:", {
                name: data.name,
                categories: data.categories,
                modelFileName: modelFile.name,
                imageFileName: productImageFile.name,
            });

            // Simulate async operation
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            toast({
                title: "Success (Mock)",
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
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Add New Product</CardTitle>
                <CardDescription>
                    Fill in the details for your new 3D product model.
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
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
                            name="categories"
                            render={() => (
                                <FormItem>
                                <div className="mb-4">
                                    <FormLabel className="text-base">Categories</FormLabel>
                                    <FormDescription>
                                        Select one or more categories for your product.
                                    </FormDescription>
                                </div>
                                <div className="space-y-2">
                                    {mockCategories.map((item) => (
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
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="productImage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Image</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="file" 
                                            accept="image/png, image/jpeg, image/webp"
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
                                    <FormLabel>3D Model File (.glb, .gltf)</FormLabel>
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
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="ghost" asChild>
                            <Link href="/admin/products">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Product'}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
