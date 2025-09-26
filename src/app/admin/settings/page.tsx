
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import type { SiteSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

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

const siteSettingsFormSchema = z.object({
    name: z.string().min(1, "App name is required"),
    description: z.string().optional(),
});

type SiteSettingsFormValues = z.infer<typeof siteSettingsFormSchema>;

export default function SettingsPage() {
    const [isLogoSubmitting, setIsLogoSubmitting] = useState(false);
    const [isSiteSettingsSubmitting, setIsSiteSettingsSubmitting] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const { toast } = useToast();
    
    const logoForm = useForm<LogoFormValues>({
        resolver: zodResolver(logoFormSchema),
    });

    const siteSettingsForm = useForm<SiteSettingsFormValues>({
        resolver: zodResolver(siteSettingsFormSchema),
        defaultValues: { name: "", description: "" },
    });

    const getLogoUrl = () => {
        const { data } = supabase.storage.from('site-assets').getPublicUrl(LOGO_PATH);
        return `${data.publicUrl}?t=${new Date().getTime()}`;
    }

    useEffect(() => {
        setLogoUrl(getLogoUrl());

        const fetchSettings = async () => {
            setLoadingSettings(true);
            const docRef = doc(db, 'siteSettings', 'main');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const settings = docSnap.data() as SiteSettings;
                siteSettingsForm.reset({
                    name: settings.name || "",
                    description: settings.description || "",
                });
            }
            setLoadingSettings(false);
        }
        fetchSettings();

    }, [siteSettingsForm]);

    const onLogoSubmit = async (data: LogoFormValues) => {
        setIsLogoSubmitting(true);
        const logoFile = data.logoFile?.[0];

        if (!logoFile) {
            toast({ variant: "destructive", title: "Error", description: "Please select a logo file." });
            setIsLogoSubmitting(false);
            return;
        }

        try {
            const { error } = await supabase.storage
                .from('site-assets')
                .upload(LOGO_PATH, logoFile, {
                    cacheControl: '3600',
                    upsert: true,
                });
            
            if (error) throw error;
            
            toast({
                title: "Success",
                description: "Logo updated successfully.",
            });

            setLogoUrl(getLogoUrl());
            window.dispatchEvent(new Event('storage'));

        } catch (error: any) {
            console.error("Error uploading logo: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to upload logo.",
            });
        } finally {
            setIsLogoSubmitting(false);
            logoForm.reset();
        }
    };
    
    const onSiteSettingsSubmit = async (data: SiteSettingsFormValues) => {
        setIsSiteSettingsSubmitting(true);
        try {
            const docRef = doc(db, 'siteSettings', 'main');
            await setDoc(docRef, {
                name: data.name,
                description: data.description,
            }, { merge: true });

            toast({
                title: "Success",
                description: "Site settings updated successfully.",
            });
             window.dispatchEvent(new Event('storage'));
        } catch (error: any) {
            console.error("Error updating site settings: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to update site settings.",
            });
        } finally {
            setIsSiteSettingsSubmitting(false);
        }
    }
    
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
                    <CardTitle>Site Info</CardTitle>
                    <CardDescription>Manage your application's name and description.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loadingSettings ? (
                         <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    ) : (
                        <Form {...siteSettingsForm}>
                            <form onSubmit={siteSettingsForm.handleSubmit(onSiteSettingsSubmit)} className="space-y-4">
                                <FormField
                                    control={siteSettingsForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>App Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Your App Name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={siteSettingsForm.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>App Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="A short description of your application." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isSiteSettingsSubmitting}>
                                    {isSiteSettingsSubmitting ? 'Saving...' : 'Save Site Info'}
                                </Button>
                            </form>
                        </Form>
                    )}
                </CardContent>
            </Card>

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
                                    key={logoUrl}
                                    src={logoUrl} 
                                    alt="Current Site Logo" 
                                    width={100} 
                                    height={50} 
                                    unoptimized
                                    className="object-contain"
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No logo uploaded yet.</p>
                        )}
                    </div>
                     <Form {...logoForm}>
                        <form onSubmit={logoForm.handleSubmit(onLogoSubmit)} className="space-y-4">
                            <FormField
                                control={logoForm.control}
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
                            <Button type="submit" disabled={isLogoSubmitting}>
                                {isLogoSubmitting ? 'Uploading...' : 'Save Logo'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
