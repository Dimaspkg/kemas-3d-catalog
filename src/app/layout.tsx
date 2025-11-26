
import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import Header from '@/components/header';

export const metadata: Metadata = {
  title: 'KEMAS Innovations',
  description: 'Interactive 3D cosmetic product customizer.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Ganti 'your-project-id' dengan ID Proyek Adobe Fonts Anda */}
        <link rel="stylesheet" href="https://use.typekit.net/your-project-id.css" />
      </head>
      <body className="font-body antialiased">
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
