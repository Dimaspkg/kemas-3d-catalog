
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Brush, Gem, Package } from 'lucide-react';
import Header from '@/components/header';
import Image from 'next/image';

const features = [
  {
    icon: <Brush className="w-8 h-8 text-primary" />,
    title: 'Customization at Your Fingertips',
    description: 'Easily change colors, materials, and finishes to match your brand aesthetic. See your changes in real-time with our interactive 3D viewer.',
  },
  {
    icon: <Gem className="w-8 h-8 text-primary" />,
    title: 'Premium Materials & Finishes',
    description: 'Experiment with a wide range of high-quality materials, from glossy plastics to polished metals, to create a truly unique product.',
  },
  {
    icon: <Package className="w-8 h-8 text-primary" />,
    title: 'Ready for Production',
    description: 'Finalize your designs and access detailed specifications, ready to be sent to your manufacturing partners.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-40 flex items-center justify-center text-center overflow-hidden">
          <div className="absolute inset-0 z-0">
             <Image
                src="https://picsum.photos/seed/hero/1920/1080"
                alt="Abstract cosmetic background"
                fill
                className="object-cover"
                data-ai-hint="abstract cosmetic background"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background"></div>
          </div>
          <div className="container px-4 md:px-6 z-10">
            <div className="max-w-3xl mx-auto space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold tracking-tight">
                Design the Future of Cosmetics
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Welcome to KEMAS Innovations, the interactive 3D product visualizer that brings your packaging ideas to life. Instantly customize and visualize your next masterpiece.
              </p>
              <Button asChild size="lg" className="font-semibold">
                <Link href="/canvas">
                  Start Customizing <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="items-center space-y-4">
                    {feature.icon}
                    <CardTitle className="font-headline text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
       <footer className="py-6 bg-card border-t">
        <div className="container px-4 md:px-6 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} KEMAS Innovations. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
