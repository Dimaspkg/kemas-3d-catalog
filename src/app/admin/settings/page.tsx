
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { db, auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from 'firebase/auth';
import Image from 'next/image';
import type { Settings } from '@/lib/types';
import { onAuthStateChanged } from 'firebase/auth';

const settingsFormSchema = z.object({
    logoFile: z.any().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const { toast } = useToast();

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsFormSchema),
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const docRef = doc(db, 'settings', 'general');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSettings(docSnap.data() as Settings);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const uploadFile = async (file: File, bucket: string, userId: string): Promise<string> => {
        const safeFileName = file.name.replace(/\s+/g, '-');
        const fileName = `${userId}/${uuidv4()}-${safeFileName}`;
        const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });
        if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`);
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return publicUrl;
    };

    const onSubmit = async (data: SettingsFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }
        
        const logoFile = data.logoFile?.[0];
        if (!logoFile) {
            toast({ variant: 'destructive', title: 'No file selected', description: 'Please select a logo file to upload.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const logoURL = await uploadFile(logoFile, 'assets', user.uid);
            const settingsRef = doc(db, 'settings', 'general');
            await setDoc(settingsRef, { logoURL }, { merge: true });

            setSettings(prev => ({...prev, logoURL}));
            
            toast({
                title: 'Success',
                description: 'Logo updated successfully.',
            });
            form.reset();
        } catch (error: any) {
            console.error('Error updating logo:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update logo.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Site Settings</h2>
                    <p className="text-muted-foreground">
                        Manage general site settings like the logo.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Logo</CardTitle>
                    <CardDescription>Upload a new logo for your site. Recommended size: 100x50 pixels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">Current Logo</h3>
                        {loading ? (
                            <Skeleton className="h-[50px] w-[100px]" />
                        ) : settings?.logoURL ? (
                            <Image src={settings.logoURL} alt="Current logo" width={100} height={50} className="object-contain bg-muted p-2 rounded-md" />
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
                                                accept="image/png, image/jpeg, image/webp, image/svg+xml"
                                                onChange={(e) => field.onChange(e.target.files)}
                                            />
                                        </FormControl>
                                        <FormDescription>The new logo will replace the current one across the site.</FormDescription>
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
