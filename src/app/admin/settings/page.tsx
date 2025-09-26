
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Image from 'next/image';

const LOGO_PATH = 'public/logo.svg';

const logoFormSchema = z.object({
    logoFile: z.any().refine(
        (files) => files?.length > 0,
        "A logo file is required."
    ).refine(
        (files) => files?.[0]?.type === 'image/svg+xml',
        "Logo must be an SVG file."
    ),
});

type LogoFormValues = z.infer<typeof logoFormSchema>;

export default function SettingsPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const { toast } = useToast();
    
    const form = useForm<LogoFormValues>({
        resolver: zodResolver(logoFormSchema),
    });

    const getLogoUrl = () => {
        const { data } = supabase.storage.from('site-assets').getPublicUrl(LOGO_PATH);
        // Add a timestamp to bust the cache
        return `${data.publicUrl}?t=${new Date().getTime()}`;
    }

    useEffect(() => {
        setLogoUrl(getLogoUrl());
    }, []);

    const onSubmit = async (data: LogoFormValues) => {
        setIsSubmitting(true);
        const logoFile = data.logoFile?.[0];

        if (!logoFile) {
            toast({ variant: "destructive", title: "Error", description: "Please select a logo file." });
            setIsSubmitting(false);
            return;
        }

        try {
            const { error } = await supabase.storage
                .from('site-assets')
                .upload(LOGO_PATH, logoFile, {
                    cacheControl: '3600',
                    upsert: true, // This will overwrite the existing file
                });
            
            if (error) throw error;
            
            toast({
                title: "Success",
                description: "Logo updated successfully.",
            });

            // Update the preview
            setLogoUrl(getLogoUrl());

        } catch (error: any) {
            console.error("Error uploading logo: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to upload logo.",
            });
        } finally {
            setIsSubmitting(false);
            form.reset();
        }
    };
    
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your site-wide settings here.
                </p>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Site Logo</CardTitle>
                    <CardDescription>Upload or update your site's logo. The logo must be an SVG file.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">Current Logo</h3>
                        {logoUrl ? (
                            <div className="p-4 border rounded-md bg-muted/50 w-fit">
                                <Image 
                                    src={logoUrl} 
                                    alt="Current Site Logo" 
                                    width={100} 
                                    height={50} 
                                    unoptimized // Necessary for SVGs loaded via Next's Image component
                                    className="object-contain"
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No logo uploaded yet.</p>
                        )}
                    </div>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="logoFile"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Upload New Logo</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="file" 
                                                accept="image/svg+xml"
                                                onChange={(e) => field.onChange(e.target.files)}
                                            />
                                        </FormControl>
                                        <FormDescription>The file should be in .svg format.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Uploading...' : 'Save Logo'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
