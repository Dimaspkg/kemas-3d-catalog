
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { db } from '@/lib/firebase';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';
import { Slider } from '@/components/ui/slider';

const materialFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    metalness: z.number().min(0).max(1),
    roughness: z.number().min(0).max(1),
    opacity: z.number().min(0).max(1),
});
type MaterialFormValues = z.infer<typeof materialFormSchema>;

interface AddMaterialDialogProps {
    user: User;
}

export function AddMaterialDialog({ user }: AddMaterialDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const form = useForm<MaterialFormValues>({
        resolver: zodResolver(materialFormSchema),
        defaultValues: { name: "", metalness: 0, roughness: 0.5, opacity: 1 },
    });
    
    const metalnessValue = form.watch('metalness');
    const roughnessValue = form.watch('roughness');
    const opacityValue = form.watch('opacity');

    const onSubmit = async (data: MaterialFormValues) => {
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "materials"), {
                name: data.name,
                metalness: data.metalness,
                roughness: data.roughness,
                opacity: data.opacity,
                createdAt: new Date(),
                userId: user.uid,
            });

            toast({
                title: "Success",
                description: `Material "${data.name}" added successfully.`,
            });
            form.reset();
            setOpen(false);
        } catch (error: any) {
            console.error("Error adding material: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to add material.",
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
                    Add Material
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Material</DialogTitle>
                    <DialogDescription>
                        Create a new material for 3D product customization.
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
                                {isSubmitting ? 'Saving...' : 'Save Material'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
