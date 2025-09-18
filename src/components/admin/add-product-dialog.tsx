
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { db } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { collection, addDoc } from 'firebase/firestore';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

interface Category {
  id: string;
  name: string;
}

const productFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    categories: z.array(z.string()).refine((value) => value.length > 0, {
        message: "You must select at least one category.",
    }),
    modelFile: (typeof window === 'undefined' ? z.any() : z.instanceof(FileList)).refine(
        (files) => files?.length > 0,
        "A model file is required."
      ),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export function AddProductDialog({ categories }: { categories: Category[] }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: "",
            categories: [],
        },
    });

    const onSubmit = async (data: ProductFormValues) => {
        setIsSubmitting(true);
        const file = data.modelFile[0];
        if (!file) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "No file selected.",
            });
            setIsSubmitting(false);
            return;
        }

        try {
            // Upload file to Supabase Storage
            const filePath = `models/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
              .from('models') // Assuming your bucket is named 'models'
              .upload(filePath, file);

            if (uploadError) {
              throw uploadError;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('models')
              .getPublicUrl(filePath);

            if (!urlData.publicUrl) {
                throw new Error("Could not get public URL for the model.");
            }
            
            const downloadURL = urlData.publicUrl;

            // Add model data to Firestore
            await addDoc(collection(db, "models"), {
                name: data.name,
                categories: data.categories,
                modelURL: downloadURL,
            });

            toast({
                title: "Success",
                description: "Product added successfully.",
            });
            form.reset();
            setOpen(false);
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Product
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                        Fill in the details for your new 3D product model.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Product'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
