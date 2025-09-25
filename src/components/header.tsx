
'use server';

import Link from "next/link";
import { Button } from "./ui/button";
import HeaderClient from "./header-client";

export default async function Header() {

  return (
    <header className="px-4 lg:px-8 py-4 border-b flex items-center justify-end bg-background z-20 sticky top-0">
      <Link href="/" className="flex items-center gap-4">
        
      </Link>
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" asChild className="text-base text-muted-foreground hover:text-foreground uppercase">
                <Link href="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild className="text-base text-muted-foreground hover:text-foreground uppercase">
                <Link href="/products">Products</Link>
            </Button>
            <HeaderClient />
        </nav>
      </div>
    </header>
  );
}
