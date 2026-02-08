
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LanguageHandler } from "@/components/layout/LanguageHandler";
import { ThemeHandler } from "@/components/layout/ThemeHandler";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { BottomNav } from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'FLASH | Premium Digital Bank',
  description: 'High-authority financial ecosystem for precise digital asset management.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FLASH',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background selection:bg-primary/20">
        <FirebaseClientProvider>
          <LanguageHandler />
          <ThemeHandler />
          <main className="min-h-screen">
            <div className="page-fade">
              {children}
            </div>
            <BottomNav />
          </main>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
