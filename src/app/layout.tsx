
import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';

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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
