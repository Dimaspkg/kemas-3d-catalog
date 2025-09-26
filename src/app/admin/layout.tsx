
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Home, Package, Menu, LogOut, Image as ImageIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect } from "react";

function NavMenu({ className }: { className?: string }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    return (
        <nav className={className}>
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">Admin</span>
                </div>
                 <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Logout</span>
                </Button>
            </div>
            <div className="flex flex-col gap-1 p-4">
                <Button 
                    asChild 
                    variant={pathname === '/admin' ? 'secondary' : 'ghost'} 
                    className="justify-start"
                >
                    <Link href="/admin">
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                    </Link>
                </Button>
                <Button 
                    asChild 
                    variant={pathname.startsWith('/admin/products') ? 'secondary' : 'ghost'} 
                    className="justify-start"
                >
                    <Link href="/admin/products">
                        <Package className="mr-2 h-4 w-4" />
                        Products
                    </Link>
                </Button>
                 <Button 
                    asChild 
                    variant={pathname.startsWith('/admin/environment') ? 'secondary' : 'ghost'} 
                    className="justify-start"
                >
                    <Link href="/admin/environment">
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Environment
                    </Link>
                </Button>
            </div>
        </nav>
    );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      }
    });

    return () => {
        unsubscribe();
    };
  }, [router]);
  
  return (
    <div className="min-h-screen w-full">
        <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                     <SheetContent side="left" className="flex flex-col p-0 w-full max-w-xs">
                        <SheetHeader className="sr-only">
                        <SheetTitle>Admin Menu</SheetTitle>
                        </SheetHeader>
                        <NavMenu />
                    </SheetContent>
                </Sheet>
                <h1 className="text-xl font-semibold">Admin Panel</h1>
            </header>
            <main className="flex-1 p-4 md:p-8">
                {children}
            </main>
        </div>
    </div>
  );
}
