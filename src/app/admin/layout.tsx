
'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Home, Box, PanelLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/icons/logo';

function NavMenu({ className }: { className?: string }) {
    const pathname = usePathname();
    return (
        <nav className={className}>
            <div className="flex items-center gap-2 p-4 border-b">
                <Logo className="h-8 w-8 text-primary" />
                <span className="text-lg font-semibold">Cosmetic Canvas</span>
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
                    variant={pathname.startsWith('/admin/model') ? 'secondary' : 'ghost'} 
                    className="justify-start"
                >
                    <Link href="/admin/model">
                        <Box className="mr-2 h-4 w-4" />
                        Models
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
  const [open, setOpen] = useState(false);
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
        <div className="min-h-screen w-full">
            <div className="flex flex-col">
                 <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <SheetTrigger asChild>
                        <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        >
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <h1 className="text-xl font-semibold">Admin Panel</h1>
                </header>
                <main className="flex-1 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
        <SheetContent side="left" className="flex flex-col p-0 w-full max-w-xs">
            <SheetHeader className="sr-only">
              <SheetTitle>Admin Menu</SheetTitle>
            </SheetHeader>
            <NavMenu />
        </SheetContent>
    </Sheet>
  );
}
