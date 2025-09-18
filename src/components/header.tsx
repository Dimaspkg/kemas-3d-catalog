
import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { Button } from "./ui/button";

export default function Header() {
  return (
    <header className="px-4 lg:px-8 py-3 border-b flex items-center justify-between bg-card shadow-sm z-20 relative">
      <Link href="/" className="flex items-center gap-4">
        <Logo className="h-8 w-8 text-primary-foreground" style={{ color: 'hsl(var(--primary))' }} />
        <h1 className="text-2xl font-headline font-bold text-foreground">
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
      </nav>
    </header>
  );
}
