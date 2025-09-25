
'use client';

import Link from "next/link";
import { Logo } from "@/components/icons/logo";
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
    <header className="px-4 lg:px-8 py-6 border-b flex items-center justify-between bg-card shadow-sm z-50 sticky top-0">
      <Link href="/" className="flex items-center gap-4">
        <Logo className="h-12 w-12 text-primary-foreground" style={{ color: 'hsl(var(--primary))' }} />
        <h1 className="text-4xl font-headline font-bold text-foreground">
          KEMAS Innovations
        </h1>
      </Link>
      <nav className="flex items-center gap-2">
        <Button variant="ghost" asChild>
            <Link href="/">Home</Link>
        </Button>
        <Button variant="ghost" asChild>
            <Link href="/products">Products</Link>
        </Button>
         <Button variant="ghost" asChild>
            <Link href="/canvas">Customize</Link>
        </Button>
        {user ? (
          <Button asChild>
            <Link href="/admin">Admin</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        )}
      </nav>
    </header>
  );
}
