
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Home, Box } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/icons/logo';

function AdminHeader() {
    return (
        <header className="px-4 lg:px-8 py-4 border-b flex items-center gap-4 bg-card shadow-sm">
            <SidebarTrigger />
            <h1 className="text-2xl font-headline font-bold text-foreground">
                Admin Panel
            </h1>
        </header>
    )
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  return (
    <SidebarProvider>
        <Sidebar collapsible="offcanvas">
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                    <Logo className="h-8 w-8 text-primary" />
                    <span className="text-lg font-semibold">Cosmetic Canvas</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/admin'}>
                            <Link href="/admin">
                                <Home />
                                Dashboard
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/model')}>
                            <Link href="/admin/model">
                                <Box />
                                Models
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
                <AdminHeader />
                <main className="flex-1 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
