
import Link from "next/link";
import Header from "@/components/header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Welcome to Cosmetic Canvas</CardTitle>
            <CardDescription>
              Your interactive 3D product customization tool.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Unleash your creativity and design your perfect cosmetic product.
              Adjust colors, materials, and see your creation come to life in stunning 3D.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild size="lg">
              <Link href="/custom">
                Start Customizing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
