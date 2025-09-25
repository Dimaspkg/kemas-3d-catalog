
'use client';

import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { User as UserIcon, Search, ShoppingBag } from 'lucide-react';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="px-4 lg:px-8 py-8 border-b flex items-center justify-between bg-background z-20 sticky top-0">
      <Link href="/" className="flex items-center gap-4">
        
      </Link>
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground uppercase">
                <Link href="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground uppercase">
                <Link href="/products">Products</Link>
            </Button>
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground uppercase">
                <Link href="/canvas">Customize</Link>
            </Button>
        </nav>
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ShoppingBag className="h-5 w-5" />
                <span className="sr-only">Cart</span>
            </Button>
            {user ? (
              <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
                <Link href="/admin">
                    <UserIcon className="h-5 w-5" />
                    <span className="sr-only">Admin</span>
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
                <Link href="/login">
                    <UserIcon className="h-5 w-5" />
                    <span className="sr-only">Login</span>
                </Link>
              </Button>
            )}
        </div>
      </div>
    </header>
  );
}
