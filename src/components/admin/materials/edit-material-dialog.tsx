
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Pencil } from 'lucide-react';
import type { Material } from '@/lib/types';
import { Slider } from '@/components/ui/slider';

const materialFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    metalness: z.number().min(0).max(1),
    roughness: z.number().min(0).max(1),
    opacity: z.number().min(0).max(1),
});
type MaterialFormValues = z.infer<typeof materialFormSchema>;

interface EditMaterialDialogProps {
    material: Material;
    trigger?: React.ReactNode;
}

export function EditMaterialDialog({ material, trigger }: EditMaterialDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const form = useForm<MaterialFormValues>({
        resolver: zodResolver(materialFormSchema),
        defaultValues: {
            name: material.name,
            metalness: material.metalness,
            roughness: material.roughness,
            opacity: material.opacity ?? 1,
        },
    });

    const metalnessValue = form.watch('metalness');
    const roughnessValue = form.watch('roughness');
    const opacityValue = form.watch('opacity');

    const onSubmit = async (data: MaterialFormValues) => {
        setIsSubmitting(true);
        try {
            const materialRef = doc(db, "materials", material.id);
            await updateDoc(materialRef, { ...data });
            toast({
                title: "Success",
                description: `Material updated to "${data.name}".`,
            });
            form.reset(data);
            setOpen(false);
        } catch (error) {
            console.error("Error updating material: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update material.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            form.reset({
                name: material.name,
                metalness: material.metalness,
                roughness: material.roughness,
                opacity: material.opacity ?? 1,
            });
        }
        setOpen(isOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit Material</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Material</DialogTitle>
                    <DialogDescription>
                        Update the properties of the material.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Material Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Glossy Plastic" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="metalness"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Metalness ({metalnessValue})</FormLabel>
                                    <FormControl>
                                        <Slider
                                            min={0}
                                            max={1}
                                            step={0.1}
                                            defaultValue={[field.value]}
                                            onValueChange={(value) => field.onChange(value[0])}
                                        />
                                    </FormControl>
                                    <FormDescription>How metallic the material is. 0 for non-metal, 1 for fully metal.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="roughness"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Roughness ({roughnessValue})</FormLabel>
                                    <FormControl>
                                        <Slider
                                            min={0}
                                            max={1}
                                            step={0.1}
                                            defaultValue={[field.value]}
                                            onValueChange={(value) => field.onChange(value[0])}
                                        />
                                    </FormControl>
                                    <FormDescription>How rough the material is. 0 for a smooth mirror, 1 for completely diffuse.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="opacity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Opacity ({opacityValue})</FormLabel>
                                    <FormControl>
                                        <Slider
                                            min={0}
                                            max={1}
                                            step={0.1}
                                            defaultValue={[field.value]}
                                            onValueChange={(value) => field.onChange(value[0])}
                                        />
                                    </FormControl>
                                    <FormDescription>The opacity of the material. 0 for fully transparent, 1 for fully opaque.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
