import { Logo } from "@/components/icons/logo";

export default function Header() {
  return (
    <header className="px-4 lg:px-8 py-4 border-b flex items-center gap-4 bg-card shadow-sm">
      <Logo className="h-8 w-8 text-primary-foreground" style={{ color: 'hsl(var(--primary))' }} />
      <h1 className="text-2xl font-headline font-bold text-foreground">
        Cosmetic Canvas
      </h1>
    </header>
  );
}
