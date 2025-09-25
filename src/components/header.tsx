
'use client';

import Link from "next/link";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="px-4 lg:px-8 py-8 border-b flex items-center justify-end bg-background z-20 sticky top-0">
      <Link href="/" className="flex items-center gap-4">
        
      </Link>
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-6 font-medium">
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
      </div>
    </header>
  );
}
