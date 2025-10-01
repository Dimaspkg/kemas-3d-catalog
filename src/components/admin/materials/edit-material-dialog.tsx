
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { db, supabase } from '@/lib/firebase';
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
import { v4 as uuidv4 } from 'uuid';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

const materialFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    metalness: z.number().min(0).max(1),
    roughness: z.number().min(0).max(1),
    opacity: z.number().min(0).max(1),
    thickness: z.number().min(0).max(5),
    ior: z.number().min(1).max(2.5),
    baseColorMapFile: z.any().optional(),
    normalMapFile: z.any().optional(),
    roughnessMapFile: z.any().optional(),
    metalnessMapFile: z.any().optional(),
    aoMapFile: z.any().optional(),
});
type MaterialFormValues = z.infer<typeof materialFormSchema>;

interface EditMaterialDialogProps {
    material: Material;
    trigger?: React.ReactNode;
}

function TexturePreview({ label, url }: { label: string, url?: string }) {
    if (!url) return null;
    return (
        <div className="text-sm">
            <span className="font-medium">{label}:</span>
            <div className="mt-1">
                <Image src={url} alt={`${label} texture preview`} width={64} height={64} className="rounded-md object-cover" />
            </div>
            <p className="text-muted-foreground text-xs mt-1">Current map uploaded.</p>
        </div>
    )
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
            thickness: material.thickness ?? 0,
            ior: material.ior ?? 1.5,
        },
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
            .from('product-images')
            .upload(fileName, file);
        if (error) throw new Error(`Texture upload failed: ${error.message}`);
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
        return publicUrl;
    };


    const onSubmit = async (data: MaterialFormValues) => {
        if (!material.id) return;
        setIsSubmitting(true);
        try {
             const textureUploads = {
                baseColorMap: data.baseColorMapFile?.[0] ? uploadTexture(data.baseColorMapFile[0], "admin") : Promise.resolve(material.baseColorMap || undefined),
                normalMap: data.normalMapFile?.[0] ? uploadTexture(data.normalMapFile[0], "admin") : Promise.resolve(material.normalMap || undefined),
                roughnessMap: data.roughnessMapFile?.[0] ? uploadTexture(data.roughnessMapFile[0], "admin") : Promise.resolve(material.roughnessMap || undefined),
                metalnessMap: data.metalnessMapFile?.[0] ? uploadTexture(data.metalnessMapFile[0], "admin") : Promise.resolve(material.metalnessMap || undefined),
                aoMap: data.aoMapFile?.[0] ? uploadTexture(data.aoMapFile[0], "admin") : Promise.resolve(material.aoMap || undefined),
            };

            const textureUrls = await Promise.all(Object.values(textureUploads)).then(results => {
                const keys = Object.keys(textureUploads);
                return results.reduce((acc, url, index) => {
                    acc[keys[index]] = url;
                    return acc;
                }, {} as { [key: string]: string | undefined });
            });

            const materialRef = doc(db, "materials", material.id);
            await updateDoc(materialRef, { 
                name: data.name,
                metalness: data.metalness,
                roughness: data.roughness,
                opacity: data.opacity,
                thickness: data.thickness,
                ior: data.ior,
                ...textureUrls,
             });
            toast({
                title: "Success",
                description: `Material updated to "${data.name}".`,
            });
            form.reset({ ...data });
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
                thickness: material.thickness ?? 0,
                ior: material.ior ?? 1.5,
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Material</DialogTitle>
                    <DialogDescription>
                        Update the properties of the material.
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
                                
                                <h4 className="font-medium text-sm border-t pt-4">Texture Maps (Replace existing)</h4>

                                <TexturePreview label="Base Color" url={material.baseColorMap} />
                                <FormField
                                    control={form.control}
                                    name="baseColorMapFile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Replace Base Color Map</FormLabel>
                                            <FormControl>
                                                <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <TexturePreview label="Normal" url={material.normalMap} />
                                <FormField
                                    control={form.control}
                                    name="normalMapFile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Replace Normal Map</FormLabel>
                                            <FormControl>
                                                <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <TexturePreview label="Roughness" url={material.roughnessMap} />
                                <FormField
                                    control={form.control}
                                    name="roughnessMapFile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Replace Roughness Map</FormLabel>
                                            <FormControl>
                                                <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <TexturePreview label="Metalness" url={material.metalnessMap} />
                                <FormField
                                    control={form.control}
                                    name="metalnessMapFile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Replace Metalness Map</FormLabel>
                                            <FormControl>
                                                <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <TexturePreview label="Ambient Occlusion" url={material.aoMap} />
                                 <FormField
                                    control={form.control}
                                    name="aoMapFile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Replace Ambient Occlusion (AO) Map</FormLabel>
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
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
