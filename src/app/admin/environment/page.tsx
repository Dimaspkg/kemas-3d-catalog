
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Environment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadEnvironmentDialog } from '@/components/admin/upload-environment-dialog';
import { EnvironmentCard } from '@/components/admin/environment-card';
import type { User } from 'firebase/auth';

function EnvironmentCardSkeleton() {
    return (
        <div className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-1/3" />
        </div>
    );
}

export default function EnvironmentManagementPage() {
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            setUser(user);
        });

        const q = query(collection(db, 'environments'), orderBy('createdAt', 'desc'));
        const unsubscribeEnvironments = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Environment));
            setEnvironments(data);
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeEnvironments();
        };
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Environment Management</h2>
                    <p className="text-muted-foreground">
                        Manage your 3D canvas background environments (.hdr files).
                    </p>
                </div>
                {user && <UploadEnvironmentDialog user={user} />}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <EnvironmentCardSkeleton key={i} />)}
                </div>
            ) : environments.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No environments uploaded yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {environments.map((env) => (
                        <EnvironmentCard key={env.id} environment={env} />
                    ))}
                </div>
            )}
        </div>
    );
}
