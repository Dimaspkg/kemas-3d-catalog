
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

  const isAdminPage = pathname.startsWith('/admin');

  return (
    <>
      {user && (
        <Button 
            variant={isAdminPage ? 'secondary' : 'ghost'} 
            asChild 
            className={`justify-start text-base ${!isAdminPage ? 'hover:underline underline-offset-4 hover:bg-transparent' : ''}`}
        >
            <Link href="/admin">Admin</Link>
        </Button>
       )}
    </>
  );
}
