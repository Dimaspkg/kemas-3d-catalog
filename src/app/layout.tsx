
import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settingsDoc = await getDoc(doc(db, 'siteSettings', 'main'));
    if (settingsDoc.exists()) {
      const settings = settingsDoc.data();
      return {
        title: settings.name || 'KEMAS Innovations',
        description: settings.description || 'Interactive 3D cosmetic product customizer.',
      };
    }
  } catch (error) {
    console.error("Failed to fetch metadata:", error);
  }
  
  return {
    title: 'KEMAS Innovations',
    description: 'Interactive 3D cosmetic product customizer.',
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/your-project-id.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100..900;1,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
