
'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import HeaderClient from "./header-client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/firebase";
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from "react";

function NavLinks() {
    const pathname = usePathname();
    return (
        <>
            <Button variant={pathname === '/' ? 'secondary' : 'ghost'} asChild className="justify-start">
                <Link href="/">Home</Link>
            </Button>
            <Button variant={pathname.startsWith('/products') ? 'secondary' : 'ghost'} asChild className="justify-start">
                <Link href="/products">Products</Link>
            </Button>
            <HeaderClient />
        </>
    )
}

export default function Header() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [appName, setAppName] = useState<string | undefined>();
  
  useEffect(() => {
    const fetchHeaderData = () => {
      // Fetch Logo
      const { data } = supabase.storage.from('site-assets').getPublicUrl('public/logo.svg');
      if (data.publicUrl) {
        setLogoUrl(`${data.publicUrl}?t=${new Date().getTime()}`);
      }

      // Fetch App Name
      getDoc(doc(db, 'siteSettings', 'main')).then(docSnap => {
        if (docSnap.exists()) {
          setAppName(docSnap.data().name);
        } else {
          setAppName('KEMAS Innovations');
        }
      });
    }

    fetchHeaderData();

    // Listen for changes from the settings page
    const handleStorageChange = () => {
      fetchHeaderData();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

  }, []);

  return (
    <header className="px-4 lg:px-8 py-3 border-b flex items-center justify-between bg-background z-20 sticky top-0">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        {logoUrl && (
          <Image 
            key={logoUrl}
            src={logoUrl} 
            alt="Site Logo"
            width={28}
            height={28}
            unoptimized
            className="h-7 w-7 text-primary"
          />
        )}
        <span className="hidden sm:inline-block">{appName || '...'}</span>
      </Link>
      
      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-2">
        <NavLinks />
      </nav>

      {/* Mobile Nav */}
      <div className="md:hidden">
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Menu />
                    <span className="sr-only">Open Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle className="sr-only">Main Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                    <NavLinks />
                </div>
            </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
