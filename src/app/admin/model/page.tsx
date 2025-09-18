
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { db } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

interface Model {
  id: string;
  name: string;
  categories: string[];
  modelURL: string;
}

interface Category {
  id: string;
  name: string;
}

const modelFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    categories: z.array(z.string()).refine((value) => value.length > 0, {
        message: "You must select at least one category.",
    }),
    modelFile: (typeof window === 'undefined' ? z.any() : z.instanceof(FileList)).refine(
        (files) => files?.length > 0,
        "A model file is required."
      ),
});

type ModelFormValues = z.infer<typeof modelFormSchema>;

const categoryFormSchema = z.object({
    name: z.string().min(3, "Category name must be at least 3 characters long."),
});
type CategoryFormValues = z.infer<typeof categoryFormSchema>;


function AddModelDialog({ categories }: { categories: Category[] }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const form = useForm<ModelFormValues>({
        resolver: zodResolver(modelFormSchema),
        defaultValues: {
            name: "",
            categories: [],
        },
    });

    const onSubmit = async (data: ModelFormValues) => {
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
                description: "Model added successfully.",
            });
            form.reset();
            setOpen(false);
        } catch (error: any) {
            console.error("Error adding document: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to add model.",
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
                    Add Model
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Model</DialogTitle>
                    <DialogDescription>
                        Fill in the details for your new 3D model.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Model Name</FormLabel>
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
                                        Select one or more categories for your model.
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
                                {isSubmitting ? 'Saving...' : 'Save Model'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function AddCategoryDialog() {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryFormSchema),
        defaultValues: { name: "" },
    });

    const onSubmit = async (data: CategoryFormValues) => {
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "categories"), { name: data.name });
            toast({
                title: "Success",
                description: `Category "${data.name}" added.`,
            });
            form.reset();
            setOpen(false);
        } catch (error) {
            console.error("Error adding category: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to add category.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Category
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                        Create a new category to group your models.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Lipsticks" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Category'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


export default function ModelManagementPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const unsubscribeModels = onSnapshot(collection(db, 'models'), (snapshot) => {
      const modelsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Model));
      setModels(modelsData);
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
        const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(categoriesData);
    });

    return () => {
      unsubscribeModels();
      unsubscribeCategories();
    };
  }, []);

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Model Management</h2>
                <p className="text-muted-foreground">
                    Manage your 3D models and categories here.
                </p>
            </div>
            <AddModelDialog categories={categories} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Your Models</CardTitle>
                    <CardDescription>
                    A list of your uploaded 3D models.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {models.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No models uploaded yet.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Categories</TableHead>
                                <TableHead>File</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {models.map((model) => (
                                <TableRow key={model.id}>
                                    <TableCell className="font-medium">{model.name}</TableCell>
                                    <TableCell>{model.categories?.join(', ')}</TableCell>
                                     <TableCell>
                                        <a href={model.modelURL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            View
                                        </a>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Categories</CardTitle>
                        <CardDescription>
                            Group your models into categories.
                        </CardDescription>
                    </div>
                    <AddCategoryDialog />
                </CardHeader>
                <CardContent>
                     {categories.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No categories created yet.</p>
                        </div>
                     ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
