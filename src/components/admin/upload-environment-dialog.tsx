
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import type { User } from 'firebase/auth';

const environmentFormSchema = z.object({
    name: z.string().min(3, "Environment name must be at least 3 characters long."),
    envFile: z.any().refine(
        (files) => files?.length > 0,
        "An environment file is required."
    ).refine(
        (files) => {
            const fileName = files?.[0]?.name.toLowerCase();
            return fileName?.endsWith('.hdr') || fileName?.endsWith('.exr');
        },
        "File must be a .hdr or .exr file."
    ),
});
type EnvironmentFormValues = z.infer<typeof environmentFormSchema>;

interface UploadEnvironmentDialogProps {
    user: User;
}

export function UploadEnvironmentDialog({ user }: UploadEnvironmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const form = useForm<EnvironmentFormValues>({
        resolver: zodResolver(environmentFormSchema),
        defaultValues: { name: "" },
    });

    const onSubmit = async (data: EnvironmentFormValues) => {
        setIsSubmitting(true);
        const envFile = data.envFile[0];

        try {
            const fileName = `${user.uid}/${uuidv4()}-${envFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('environment-maps')
                .upload(fileName, envFile, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw new Error(`Environment file upload failed: ${uploadError.message}`);

            const { data: { publicUrl: fileURL } } = supabase.storage
                .from('environment-maps')
                .getPublicUrl(fileName);
            
            await addDoc(collection(db, "environments"), {
                name: data.name,
                fileURL,
                isActive: false,
                createdAt: new Date(),
                userId: user.uid,
            });

            toast({
                title: "Success",
                description: `Environment "${data.name}" uploaded successfully.`,
            });
            form.reset();
            setOpen(false);
        } catch (error: any) {
            console.error("Error uploading environment: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to upload environment.",
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
                    Add Environment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Environment</DialogTitle>
                    <DialogDescription>
                        Upload a new .hdr or .exr file to use as a background environment.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Environment Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Studio Light" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="envFile"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Environment File (.hdr, .exr)</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="file" 
                                            accept=".hdr,.exr"
                                            onChange={(e) => field.onChange(e.target.files)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Uploading...' : 'Upload'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
