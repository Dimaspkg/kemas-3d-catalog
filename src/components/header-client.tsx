
'use client';

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "./ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HeaderClient() {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {user && (
        <Button variant={pathname.startsWith('/admin') ? 'secondary' : 'ghost'} asChild className="justify-start">
            <Link href="/admin">Admin</Link>
        </Button>
       )}
    </>
  );
}
