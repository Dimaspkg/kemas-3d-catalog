
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Home, Package, LogOut, Image as ImageIcon, Settings, Gem } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { signOut } from "firebase/auth";
import { Toaster } from "@/components/ui/toaster";
import { HeaderLogo } from "@/components/header-logo";
import { Separator } from "@/components/ui/separator";


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
      await signOut(auth);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
  };
  
  return (
    <html lang="en" suppressHydrationWarning>
       <body className="font-body antialiased">
         <SidebarProvider>
            <Sidebar variant="floating" collapsible="icon">
              <SidebarHeader>
                  <HeaderLogo logoUrl={null} />
              </SidebarHeader>
              <SidebarContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin'}>
                      <Link href="/admin">
                        <Home />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/products')}>
                      <Link href="/admin/products">
                        <Package />
                        <span>Products</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/environment')}>
                        <Link href="/admin/environment">
                          <ImageIcon />
                          <span>Environment</span>
                        </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/materials')}>
                      <Link href="/admin/materials">
                        <Gem />
                        <span>Materials</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                     <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/settings')}>
                        <Link href="/admin/settings">
                          <Settings />
                          <span>Settings</span>
                        </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarContent>
              <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout}>
                            <LogOut />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
            </Sidebar>
            <SidebarInset>
              <header className="flex h-12 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:h-14 md:px-6">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="md:hidden" />
                  <Separator orientation="vertical" className="mx-2 h-6 md:hidden" />
                  <div className="hidden text-sm font-medium md:block">
                     <span className="text-muted-foreground">Admin /</span> {pathname.split('/').pop() || 'Dashboard'}
                  </div>
                </div>
              </header>
              <main className="flex-1 p-4 md:p-6 lg:p-8">
                {children}
              </main>
            </SidebarInset>
         </SidebarProvider>
         <Toaster />
       </body>
    </html>
  );
}
