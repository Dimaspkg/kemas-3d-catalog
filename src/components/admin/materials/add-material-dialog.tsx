
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { db, auth } from '@/lib/firebase';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';
import { Slider } from '@/components/ui/slider';
import { v4 as uuidv4 } from 'uuid';
import { ScrollArea } from '@/components/ui/scroll-area';

const materialFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    metalness: z.number().min(0).max(1),
    roughness: z.number().min(0).max(1),
    opacity: z.number().min(0).max(1),
    thickness: z.number().min(0).max(5),
    ior: z.number().min(1).max(2.5),
    baseColorMap: z.any().optional(),
    normalMap: z.any().optional(),
    roughnessMap: z.any().optional(),
    metalnessMap: z-any().optional(),
    aoMap: z.any().optional(),
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
        defaultValues: { name: "", metalness: 0, roughness: 0.5, opacity: 1, thickness: 0, ior: 1.5 },
    });
    
    const metalnessValue = form.watch('metalness');
    const roughnessValue = form.watch('roughness');
    const opacityValue = form.watch('opacity');
    const thicknessValue = form.watch('thickness');
    const iorValue = form.watch('ior');
    
    const uploadTexture = async (file: File, userId: string): Promise<string> => {
        if (!file) return "";
        const safeFileName = file.name.replace(/\s+/g, '-');
        const fileName = `materials/${userId}/${uuidv4()}-${safeFileName}`;
        const { error } = await supabase.storage
            .from('product-images') // Re-using product-images bucket for simplicity
            .upload(fileName, file);
        if (error) throw new Error(`Texture upload failed: ${error.message}`);
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
        return publicUrl;
    };


    const onSubmit = async (data: MaterialFormValues) => {
        setIsSubmitting(true);
        try {
            const textureUploads = {
                baseColorMap: data.baseColorMap?.[0] ? uploadTexture(data.baseColorMap[0], user.uid) : Promise.resolve(undefined),
                normalMap: data.normalMap?.[0] ? uploadTexture(data.normalMap[0], user.uid) : Promise.resolve(undefined),
                roughnessMap: data.roughnessMap?.[0] ? uploadTexture(data.roughnessMap[0], user.uid) : Promise.resolve(undefined),
                metalnessMap: data.metalnessMap?.[0] ? uploadTexture(data.metalnessMap[0], user.uid) : Promise.resolve(undefined),
                aoMap: data.aoMap?.[0] ? uploadTexture(data.aoMap[0], user.uid) : Promise.resolve(undefined),
            };

            const textureUrls = await Promise.all(Object.values(textureUploads)).then(results => {
                const keys = Object.keys(textureUploads);
                return results.reduce((acc, url, index) => {
                    if (url) {
                        acc[keys[index]] = url;
                    }
                    return acc;
                }, {} as { [key: string]: string });
            });
            
            await addDoc(collection(db, "materials"), {
                name: data.name,
                metalness: data.metalness,
                roughness: data.roughness,
                opacity: data.opacity,
                thickness: data.thickness,
                ior: data.ior,
                ...textureUrls,
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add New Material</DialogTitle>
                    <DialogDescription>
                        Create a new material for 3D product customization. Provide values or upload texture maps.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <ScrollArea className="h-[60vh] pr-6">
                            <div className="space-y-6 pt-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Material Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Brushed Steel" {...field} />
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
                                            <FormDescription>Fallback if no metalness map is provided.</FormDescription>
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
                                            <FormDescription>Fallback if no roughness map is provided.</FormDescription>
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
                                            <FormDescription>Controls transparency.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="thickness"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Thickness ({thicknessValue})</FormLabel>
                                            <FormControl>
                                                <Slider
                                                    min={0}
                                                    max={5}
                                                    step={0.1}
                                                    defaultValue={[field.value]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                />
                                            </FormControl>
                                            <FormDescription>For transparent materials, this controls thickness for refraction.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="ior"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Index of Refraction (IOR) ({iorValue})</FormLabel>
                                            <FormControl>
                                                <Slider
                                                    min={1.0}
                                                    max={2.5}
                                                    step={0.01}
                                                    defaultValue={[field.value]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                />
                                            </FormControl>
                                            <FormDescription>Controls how much light bends for transparent materials.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <h4 className="font-medium text-sm border-t pt-4">Texture Maps (Optional)</h4>
                                
                                 <FormField
                                    control={form.control}
                                    name="baseColorMap"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Base Color Map</FormLabel>
                                            <FormControl>
                                                <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="normalMap"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Normal Map</FormLabel>
                                            <FormControl>
                                                <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="roughnessMap"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Roughness Map</FormLabel>
                                            <FormControl>
                                                <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="metalnessMap"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Metalness Map</FormLabel>
                                            <FormControl>
                                                <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="aoMap"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ambient Occlusion (AO) Map</FormLabel>
                                            <FormControl>
                                                <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </ScrollArea>
                        <DialogFooter className="pt-6">
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
