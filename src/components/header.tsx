
import Link from "next/link";
import { Button } from "./ui/button";
import HeaderClient from "./header-client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Menu } from "lucide-react";
import { HeaderLogo } from "./header-logo";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { Settings } from "@/lib/types";

function NavLinks() {
    return (
        <>
            <Button variant="ghost" asChild className="justify-start text-base hover:bg-transparent">
                <Link href="/" className="hover-underline-animation">Home</Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start text-base hover:bg-transparent">
                <Link href="/products" className="hover-underline-animation">Packaging</Link>
            </Button>
            <HeaderClient />
        </>
    )
}

export default async function Header() {
  let logoUrl = null;
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
    if (settingsDoc.exists()) {
      logoUrl = (settingsDoc.data() as Settings).logoURL || null;
    }
  } catch (error) {
    console.error("Failed to fetch logo from Firestore:", error);
  }

  return (
    <header className="px-4 lg:px-8 py-3 border-b flex items-center justify-between bg-background z-20 sticky top-0">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <HeaderLogo logoUrl={logoUrl} />
        <span className="hidden sm:inline-block">KEMAS Innovations</span>
      </Link>
      
      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-2">
        <Button variant="ghost" asChild className="text-base hover:bg-transparent">
            <Link href="/" className="hover-underline-animation">Home</Link>
        </Button>
        <Button variant="ghost" asChild className="text-base hover:bg-transparent">
            <Link href="/products" className="hover-underline-animation">Packaging</Link>
        </Button>
        <HeaderClient />
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
