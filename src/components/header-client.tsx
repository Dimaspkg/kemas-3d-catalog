
'use client';

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "./ui/button";
import Link from "next/link";

export default function HeaderClient() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {user && (
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground uppercase">
            <Link href="/admin">Admin</Link>
        </Button>
       )}
    </>
  );
}
