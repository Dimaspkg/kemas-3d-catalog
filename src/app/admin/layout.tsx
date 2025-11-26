
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
              <SidebarHeader className="items-start p-4">
                  <HeaderLogo logoUrl={null} className="transition-all duration-200 group-data-[state=collapsed]:size-4" />
              </SidebarHeader>
              <Separator />
              <SidebarContent className="p-2">
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
              <SidebarFooter className="p-2">
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
                <div className="p-4 md:p-6 lg:p-8">
                    <SidebarTrigger className="absolute left-4 top-4 md:left-6 md:top-6" />
                    <div className="mt-12">
                        {children}
                    </div>
                </div>
            </SidebarInset>
         </SidebarProvider>
         <Toaster />
       </body>
    </html>
  );
}
