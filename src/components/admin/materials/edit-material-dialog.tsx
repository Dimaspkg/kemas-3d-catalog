
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { db, supabase, auth } from '@/lib/firebase';
import { doc, updateDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { onAuthStateChanged, type User } from 'firebase/auth';

interface MaterialCategory {
  id: string;
  name: string;
}

const materialFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    categories: z.array(z.string()).optional(),
    metalness: z.number().min(0).max(1),
    roughness: z.number().min(0).max(1),
    opacity: z.number().min(0).max(1),
    thickness: z.number().min(0).max(5),
    ior: z.number().min(1).max(2.5),
    roughnessTransmission: z.number().min(0).max(1),
    envMapIntensity: z.number().min(0).max(5),
    iridescence: z.number().min(0).max(1),
    iridescenceIOR: z.number().min(1).max(2.5),
    iridescenceThicknessMin: z.number().min(0),
    iridescenceThicknessMax: z.number().min(0),
    sheen: z.number().min(0).max(1),
    sheenColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
    sheenRoughness: z.number().min(0).max(1),
    clearcoat: z.number().min(0).max(1),
    clearcoatRoughness: z.number().min(0).max(1),
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
    const [categories, setCategories] = useState<MaterialCategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    const form = useForm<MaterialFormValues>({
        resolver: zodResolver(materialFormSchema),
        defaultValues: {
            name: material.name,
            categories: material.categories || [],
            metalness: material.metalness,
            roughness: material.roughness,
            opacity: material.opacity ?? 1,
            thickness: material.thickness ?? 0,
            ior: material.ior ?? 1.5,
            roughnessTransmission: material.roughnessTransmission ?? 0,
            envMapIntensity: material.envMapIntensity ?? 1,
            iridescence: material.iridescence ?? 0,
            iridescenceIOR: material.iridescenceIOR ?? 1.3,
            iridescenceThicknessMin: material.iridescenceThicknessRange?.[0] ?? 100,
            iridescenceThicknessMax: material.iridescenceThicknessRange?.[1] ?? 400,
            sheen: material.sheen ?? 0,
            sheenColor: material.sheenColor ?? "#ffffff",
            sheenRoughness: material.sheenRoughness ?? 1,
            clearcoat: material.clearcoat ?? 0,
            clearcoatRoughness: material.clearcoatRoughness ?? 0,
        },
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!open) return;
        setLoadingCategories(true);
        const q = query(collection(db, 'materialCategories'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaterialCategory));
            setCategories(categoriesData);
            setLoadingCategories(false);
        });

        return () => unsubscribe();
    }, [open]);

    const metalnessValue = form.watch('metalness');
    const roughnessValue = form.watch('roughness');
    const opacityValue = form.watch('opacity');
    const thicknessValue = form.watch('thickness');
    const iorValue = form.watch('ior');
    const roughnessTransmissionValue = form.watch('roughnessTransmission');
    const envMapIntensityValue = form.watch('envMapIntensity');
    const iridescenceValue = form.watch('iridescence');
    const iridescenceIORValue = form.watch('iridescenceIOR');
    const sheenValue = form.watch('sheen');
    const sheenRoughnessValue = form.watch('sheenRoughness');
    const clearcoatValue = form.watch('clearcoat');
    const clearcoatRoughnessValue = form.watch('clearcoatRoughness');
    
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
        if (!material.id || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Material ID or user not found.' });
            return;
        };
        setIsSubmitting(true);
        try {
            const updatedData: { [key: string]: any } = {
                name: data.name,
                categories: data.categories || [],
                metalness: data.metalness,
                roughness: data.roughness,
                opacity: data.opacity,
                thickness: data.thickness,
                ior: data.ior,
                roughnessTransmission: data.roughnessTransmission,
                envMapIntensity: data.envMapIntensity,
                iridescence: data.iridescence,
                iridescenceIOR: data.iridescenceIOR,
                iridescenceThicknessRange: [data.iridescenceThicknessMin, data.iridescenceThicknessMax],
                sheen: data.sheen,
                sheenColor: data.sheenColor,
                sheenRoughness: data.sheenRoughness,
                clearcoat: data.clearcoat,
                clearcoatRoughness: data.clearcoatRoughness,
            };

            const textureFields: { formKey: keyof MaterialFormValues; dbKey: keyof Material }[] = [
                { formKey: 'baseColorMapFile', dbKey: 'baseColorMap' },
                { formKey: 'normalMapFile', dbKey: 'normalMap' },
                { formKey: 'roughnessMapFile', dbKey: 'roughnessMap' },
                { formKey: 'metalnessMapFile', dbKey: 'metalnessMap' },
                { formKey: 'aoMapFile', dbKey: 'aoMap' },
            ];

            for (const { formKey, dbKey } of textureFields) {
                const file = data[formKey]?.[0];
                if (file) {
                    updatedData[dbKey] = await uploadTexture(file, user.uid);
                } else if (material[dbKey]) {
                    updatedData[dbKey] = material[dbKey];
                } else {
                    delete updatedData[dbKey];
                }
            }
            
            const materialRef = doc(db, "materials", material.id);
            await updateDoc(materialRef, updatedData);

            toast({
                title: "Success",
                description: `Material updated to "${data.name}".`,
            });
            form.reset({ ...data });
            setOpen(false);
        } catch (error: any) {
            console.error("Error updating material: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to update material.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            form.reset({
                name: material.name,
                categories: material.categories || [],
                metalness: material.metalness,
                roughness: material.roughness,
                opacity: material.opacity ?? 1,
                thickness: material.thickness ?? 0,
                ior: material.ior ?? 1.5,
                roughnessTransmission: material.roughnessTransmission ?? 0,
                envMapIntensity: material.envMapIntensity ?? 1,
                iridescence: material.iridescence ?? 0,
                iridescenceIOR: material.iridescenceIOR ?? 1.3,
                iridescenceThicknessMin: material.iridescenceThicknessRange?.[0] ?? 100,
                iridescenceThicknessMax: material.iridescenceThicknessRange?.[1] ?? 400,
                sheen: material.sheen ?? 0,
                sheenColor: material.sheenColor ?? "#ffffff",
                sheenRoughness: material.sheenRoughness ?? 1,
                clearcoat: material.clearcoat ?? 0,
                clearcoatRoughness: material.clearcoatRoughness ?? 0,
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
                                    name="categories"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Categories</FormLabel>
                                            <FormDescription>Select one or more categories.</FormDescription>
                                            {loadingCategories ? (
                                                <div className="space-y-2 pt-2">
                                                    <div className="flex items-center space-x-3"><Skeleton className="h-4 w-4" /><Skeleton className="h-4 w-20" /></div>
                                                    <div className="flex items-center space-x-3"><Skeleton className="h-4 w-4" /><Skeleton className="h-4 w-24" /></div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 pt-2">
                                                    {categories.map((item) => (
                                                        <FormField
                                                            key={item.id}
                                                            control={form.control}
                                                            name="categories"
                                                            render={({ field }) => (
                                                                <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(item.name)}
                                                                            onCheckedChange={(checked) => {
                                                                                return checked
                                                                                    ? field.onChange([...(field.value || []), item.name])
                                                                                    : field.onChange(field.value?.filter((value) => value !== item.name));
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal">{item.name}</FormLabel>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <h4 className="font-medium text-sm border-t pt-4">PBR Properties</h4>
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
                                    name="envMapIntensity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Env Map Intensity ({envMapIntensityValue})</FormLabel>
                                            <FormControl>
                                                <Slider
                                                    min={0}
                                                    max={5}
                                                    step={0.1}
                                                    defaultValue={[field.value]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                />
                                            </FormControl>
                                            <FormDescription>Controls the intensity of the environment map's reflection.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <h4 className="font-medium text-sm border-t pt-4">Transparency Properties</h4>
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
                                             <FormDescription>Controls transparency. Lower than 1 enables transmission.</FormDescription>
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
                                 <FormField
                                    control={form.control}
                                    name="roughnessTransmission"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Roughness Transmission ({roughnessTransmissionValue})</FormLabel>
                                            <FormControl>
                                                <Slider
                                                    min={0}
                                                    max={1}
                                                    step={0.05}
                                                    defaultValue={[field.value]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                />
                                            </FormControl>
                                            <FormDescription>For transparent materials, creates a frosted glass effect.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <h4 className="font-medium text-sm border-t pt-4">Iridescence Properties</h4>
                                <FormField
                                    control={form.control}
                                    name="iridescence"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Iridescence ({iridescenceValue})</FormLabel>
                                            <FormControl>
                                                <Slider
                                                    min={0}
                                                    max={1}
                                                    step={0.05}
                                                    defaultValue={[field.value]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                />
                                            </FormControl>
                                            <FormDescription>Amount of iridescence, 0 is off.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="iridescenceIOR"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Iridescence IOR ({iridescenceIORValue})</FormLabel>
                                            <FormControl>
                                                <Slider
                                                    min={1.0}
                                                    max={2.5}
                                                    step={0.01}
                                                    defaultValue={[field.value]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                />
                                            </FormControl>
                                            <FormDescription>Index of refraction for the iridescence layer.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                     <FormField
                                        control={form.control}
                                        name="iridescenceThicknessMin"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Iridescence Thickness Min (nm)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="iridescenceThicknessMax"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Iridescence Thickness Max (nm)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                
                                <h4 className="font-medium text-sm border-t pt-4">Sheen Properties (for fabric-like looks)</h4>
                                <FormField
                                    control={form.control}
                                    name="sheen"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sheen ({sheenValue})</FormLabel>
                                            <FormControl>
                                                <Slider
                                                    min={0}
                                                    max={1}
                                                    step={0.1}
                                                    defaultValue={[field.value]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                />
                                            </FormControl>
                                            <FormDescription>Amount of sheen, 0 is off. Good for velvet-like materials.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="sheenColor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sheen Color</FormLabel>
                                            <FormControl>
                                                <Input type="color" {...field} className="h-10 p-1"/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="sheenRoughness"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sheen Roughness ({sheenRoughnessValue})</FormLabel>
                                            <FormControl>
                                                <Slider
                                                    min={0}
                                                    max={1}
                                                    step={0.1}
                                                    defaultValue={[field.value]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                />
                                            </FormControl>
                                            <FormDescription>Roughness of the sheen layer.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <h4 className="font-medium text-sm border-t pt-4">Clearcoat Properties (for car paint, etc.)</h4>
                                <FormField
                                    control={form.control}
                                    name="clearcoat"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Clearcoat ({clearcoatValue})</FormLabel>
                                            <FormControl>
                                                <Slider
                                                    min={0}
                                                    max={1}
                                                    step={0.1}
                                                    defaultValue={[field.value]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                />
                                            </FormControl>
                                            <FormDescription>Adds a clear protective layer. 0 is off.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="clearcoatRoughness"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Clearcoat Roughness ({clearcoatRoughnessValue})</FormLabel>
                                            <FormControl>
                                                <Slider
                                                    min={0}
                                                    max={1}
                                                    step={0.1}
                                                    defaultValue={[field.value]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                />
                                            </FormControl>
                                            <FormDescription>Roughness of the clearcoat layer.</FormDescription>
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
